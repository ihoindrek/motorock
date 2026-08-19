<?php
/**
 * Plugin Name: Motorock Headless WooPayments
 * Description: Bridges headless GraphQL checkout to WooCommerce Payments (Stripe) on the storefront.
 * Version: 1.0.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-headless-woo-payments.php
 */

defined( 'ABSPATH' ) || exit;

function motorock_wcpay_is_available() {
	return class_exists( 'WC_Payments' ) && class_exists( 'WC_Payment_Gateway_WCPay' );
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

	return array(
		'publishableKey'       => motorock_wcpay_publishable_key(),
		'testMode'             => WC_Payments::mode()->is_test(),
		'gatewayEnabled'       => $gateway instanceof WC_Payment_Gateway && $gateway->enabled === 'yes',
		'fraudPreventionToken' => motorock_wcpay_fraud_prevention_token(),
	);
}
