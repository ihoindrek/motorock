<?php
/**
 * Plugin Name: Motorock Headless WooPayments
 * Description: Bridges headless GraphQL checkout to WooCommerce Payments (Stripe) on the storefront.
 * Version: 1.1.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-headless-woo-payments.php
 */

defined( 'ABSPATH' ) || exit;

function motorock_wcpay_is_available() {
	return class_exists( 'WC_Payments' ) && class_exists( 'WC_Payment_Gateway_WCPay' );
}

function motorock_wcpay_storefront_host() {
	if ( function_exists( 'motorock_get_storefront_url' ) ) {
		$url = motorock_get_storefront_url();
	} elseif ( defined( 'MOTOROCK_STOREFRONT_URL' ) && MOTOROCK_STOREFRONT_URL ) {
		$url = MOTOROCK_STOREFRONT_URL;
	} else {
		$env = getenv( 'MOTOROCK_STOREFRONT_URL' );
		$url = $env ? $env : 'https://motorock.eu';
	}

	$host = wp_parse_url( $url, PHP_URL_HOST );

	return is_string( $host ) ? strtolower( $host ) : '';
}

function motorock_wcpay_publishable_key() {
	if ( ! motorock_wcpay_is_available() ) {
		return '';
	}

	$account_service = WC_Payments::get_account_service();
	if ( ! $account_service ) {
		return '';
	}

	return (string) $account_service->get_publishable_key( WC_Payments::mode()->is_test() );
}

function motorock_wcpay_fraud_prevention_token() {
	if ( ! motorock_wcpay_is_available() || ! WC()->session ) {
		return '';
	}

	if ( ! class_exists( '\WCPay\Fraud_Prevention\Fraud_Prevention_Service' ) ) {
		return '';
	}

	$service = \WCPay\Fraud_Prevention\Fraud_Prevention_Service::get_instance();

	if ( ! $service->is_enabled() ) {
		return '';
	}

	return (string) $service->get_token();
}

/**
 * Register the headless storefront domain for Apple Pay / Google Pay / Link.
 *
 * WooPayments only auto-registers shop.motorock.eu; Stripe Elements runs on motorock.eu.
 *
 * @return array<string, mixed>|null
 */
function motorock_wcpay_ensure_storefront_domain_registered() {
	if ( ! motorock_wcpay_is_available() ) {
		return null;
	}

	$domain = motorock_wcpay_storefront_host();
	if ( $domain === '' ) {
		return null;
	}

	$cache_key = 'motorock_wcpay_domain_' . md5( $domain );
	$cached    = get_transient( $cache_key );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	if ( ! method_exists( 'WC_Payments', 'get_payments_api_client' ) ) {
		return null;
	}

	$api_client = WC_Payments::get_payments_api_client();
	if ( ! $api_client || ! method_exists( $api_client, 'register_domain' ) ) {
		return null;
	}

	try {
		$result = $api_client->register_domain( $domain );
		if ( is_array( $result ) ) {
			set_transient( $cache_key, $result, DAY_IN_SECONDS );
		}

		return is_array( $result ) ? $result : null;
	} catch ( Exception $exception ) {
		$error = array(
			'domain_name' => $domain,
			'error'       => $exception->getMessage(),
		);
		set_transient( $cache_key, $error, HOUR_IN_SECONDS );

		return $error;
	}
}

function motorock_wcpay_map_graphql_meta_to_post( $data, $input ) {
	if ( empty( $input['metaData'] ) || ! is_array( $input['metaData'] ) ) {
		return $data;
	}

	foreach ( $input['metaData'] as $meta ) {
		if ( ! is_array( $meta ) || empty( $meta['key'] ) || ! isset( $meta['value'] ) ) {
			continue;
		}

		$key   = (string) $meta['key'];
		$value = sanitize_text_field( (string) $meta['value'] );

		if ( $value === '' ) {
			continue;
		}

		switch ( $key ) {
			case 'wcpay_payment_method':
				$_POST['wcpay-payment-method'] = $value;
				$data['wcpay-payment-method'] = $value;
				break;
			case 'wcpay_fraud_prevention_token':
				$_POST['wcpay-fraud-prevention-token'] = $value;
				$data['wcpay-fraud-prevention-token']  = $value;
				break;
			case 'checkout_locale':
				$_POST['checkout_locale'] = $value;
				$data['checkout_locale']  = $value;
				break;
		}
	}

	if ( ! empty( $input['paymentMethod'] ) && $input['paymentMethod'] === 'woocommerce_payments' ) {
		$_POST['payment_method'] = 'woocommerce_payments';
		$data['payment_method']  = 'woocommerce_payments';
	}

	return $data;
}

add_filter(
	'woocommerce_checkout_posted_data',
	function ( $data, $input, $context, $info ) {
		unset( $context, $info );

		return motorock_wcpay_map_graphql_meta_to_post( $data, is_array( $input ) ? $input : array() );
	},
	6,
	4
);

add_action(
	'woocommerce_checkout_update_order_meta',
	function ( $order_id ) {
		if ( empty( $_POST['checkout_locale'] ) ) {
			return;
		}

		update_post_meta(
			$order_id,
			'checkout_locale',
			sanitize_text_field( wp_unslash( (string) $_POST['checkout_locale'] ) )
		);
	}
);

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'motorock/v1',
			'/woo-payments/config',
			array(
				'methods'             => 'GET',
				'callback'            => 'motorock_rest_wcpay_config',
				'permission_callback' => '__return_true',
			)
		);
	}
);

function motorock_rest_wcpay_config( WP_REST_Request $request ) {
	unset( $request );

	if ( ! motorock_wcpay_is_available() ) {
		return new WP_Error(
			'wcpay_unavailable',
			'WooCommerce Payments is not available.',
			array( 'status' => 503 )
		);
	}

	$gateway = WC()->payment_gateways()->payment_gateways()['woocommerce_payments'] ?? null;
	$domain  = motorock_wcpay_storefront_host();
	$domain_status = motorock_wcpay_ensure_storefront_domain_registered();

	return array(
		'publishableKey'       => motorock_wcpay_publishable_key(),
		'testMode'             => WC_Payments::mode()->is_test(),
		'gatewayEnabled'       => $gateway instanceof WC_Payment_Gateway && $gateway->enabled === 'yes',
		'fraudPreventionToken' => motorock_wcpay_fraud_prevention_token(),
		'storefrontDomain'     => $domain,
		'storefrontDomainStatus' => $domain_status,
	);
}
