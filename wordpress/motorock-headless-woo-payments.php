<?php
/**
 * Plugin Name: Motorock Headless WooPayments
 * Description: Bridges headless GraphQL checkout to WooCommerce Payments (Stripe) on the storefront.
 * Version: 1.3.4
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

function motorock_wcpay_stripe_account_id() {
	if ( ! motorock_wcpay_is_available() ) {
		return '';
	}

	$account_service = WC_Payments::get_account_service();
	if ( ! $account_service || ! method_exists( $account_service, 'get_stripe_account_id' ) ) {
		return '';
	}

	return (string) $account_service->get_stripe_account_id();
}

function motorock_wcpay_bootstrap_session() {
	if ( ! function_exists( 'WC' ) || ! WC()->session ) {
		return;
	}

	if ( ! WC()->session->has_session() ) {
		WC()->session->init();
	}
}

function motorock_wcpay_fraud_prevention_enabled() {
	if ( ! class_exists( '\WCPay\Fraud_Prevention\Fraud_Prevention_Service' ) ) {
		return false;
	}

	return \WCPay\Fraud_Prevention\Fraud_Prevention_Service::get_instance()->is_enabled();
}

function motorock_wcpay_fraud_prevention_token() {
	motorock_wcpay_bootstrap_session();

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

function motorock_wcpay_refresh_fraud_prevention_token() {
	if ( ! motorock_wcpay_fraud_prevention_enabled() ) {
		return '';
	}

	$token = motorock_wcpay_fraud_prevention_token();
	if ( $token !== '' ) {
		$_POST['wcpay-fraud-prevention-token'] = $token;
	}

	return $token;
}

function motorock_wcpay_store_last_payment_error( $message ) {
	motorock_wcpay_bootstrap_session();

	$message = wp_strip_all_tags( (string) $message );
	if ( $message === '' || ! WC()->session ) {
		return;
	}

	WC()->session->set( 'motorock_wcpay_last_payment_error', $message );
}

function motorock_wcpay_take_last_payment_error() {
	motorock_wcpay_bootstrap_session();

	if ( ! WC()->session ) {
		return '';
	}

	$message = (string) WC()->session->get( 'motorock_wcpay_last_payment_error', '' );
	WC()->session->set( 'motorock_wcpay_last_payment_error', null );

	return $message;
}

function motorock_wcpay_record_payment_error( $order, $raw_message, $display_message = '' ) {
	$raw_message = wp_strip_all_tags( (string) $raw_message );
	if ( $raw_message === '' ) {
		return;
	}

	$display_message = wp_strip_all_tags( (string) $display_message );
	if ( $display_message === '' ) {
		$display_message = $raw_message;
	}

	if ( $order instanceof WC_Order ) {
		$order->update_meta_data( '_motorock_payment_error', $display_message );
		$order->update_meta_data( '_motorock_payment_error_raw', $raw_message );
		$order->save();
	}

	motorock_wcpay_store_last_payment_error( $display_message );
}

function motorock_wcpay_prepare_checkout_request( array $input, WC_Order $order = null ) {
	if ( ! empty( $input['paymentMethod'] ) && $input['paymentMethod'] === 'woocommerce_payments' ) {
		motorock_wcpay_hydrate_post_from_meta_input( $input );
		motorock_wcpay_refresh_fraud_prevention_token();

		if ( $order instanceof WC_Order ) {
			motorock_wcpay_hydrate_post_from_order( $order );
		}

		if (
			empty( $_POST['wcpay-payment-method'] )
			&& empty( $_POST['wcpay-confirmation-token'] )
		) {
			throw new Exception(
				'Stripe payment credentials are missing. Please re-enter your card details and try again.'
			);
		}
	}
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
	} catch ( Throwable $throwable ) {
		$error = array(
			'domain_name' => $domain,
			'error'       => $throwable->getMessage(),
		);
		set_transient( $cache_key, $error, HOUR_IN_SECONDS );

		return $error;
	}
}

function motorock_wcpay_read_storefront_domain_status() {
	if ( ! motorock_wcpay_is_available() ) {
		return null;
	}

	$domain = motorock_wcpay_storefront_host();
	if ( $domain === '' ) {
		return null;
	}

	$cached = get_transient( 'motorock_wcpay_domain_' . md5( $domain ) );

	return is_array( $cached ) ? $cached : null;
}

function motorock_wcpay_hydrate_post_from_meta_input( array $input ) {
	if ( empty( $input['metaData'] ) || ! is_array( $input['metaData'] ) ) {
		return;
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
				break;
			case 'wcpay_confirmation_token':
				$_POST['wcpay-confirmation-token'] = $value;
				break;
			case 'wcpay_fraud_prevention_token':
				$_POST['wcpay-fraud-prevention-token'] = $value;
				break;
			case 'checkout_locale':
				$_POST['checkout_locale'] = $value;
				break;
		}
	}

	if ( ! empty( $input['paymentMethod'] ) && $input['paymentMethod'] === 'woocommerce_payments' ) {
		$_POST['payment_method'] = 'woocommerce_payments';
	}
}

function motorock_wcpay_hydrate_post_from_order( WC_Order $order ) {
	if ( $order->get_payment_method() !== 'woocommerce_payments' ) {
		return;
	}

	$payment_method_id = (string) $order->get_meta( 'wcpay_payment_method' );
	if ( $payment_method_id !== '' ) {
		$_POST['wcpay-payment-method'] = $payment_method_id;
	}

	$confirmation_token = (string) $order->get_meta( 'wcpay_confirmation_token' );
	if ( $confirmation_token !== '' ) {
		$_POST['wcpay-confirmation-token'] = $confirmation_token;
	}

	$fraud_token = (string) $order->get_meta( 'wcpay_fraud_prevention_token' );
	if ( $fraud_token !== '' ) {
		$_POST['wcpay-fraud-prevention-token'] = $fraud_token;
	}

	$_POST['payment_method'] = 'woocommerce_payments';
}

function motorock_wcpay_map_graphql_meta_to_post( $data, $input ) {
	if ( empty( $input['metaData'] ) || ! is_array( $input['metaData'] ) ) {
		if ( ! empty( $input['paymentMethod'] ) && $input['paymentMethod'] === 'woocommerce_payments' ) {
			$_POST['payment_method'] = 'woocommerce_payments';
			$data['payment_method']  = 'woocommerce_payments';
		}

		return $data;
	}

	motorock_wcpay_hydrate_post_from_meta_input( is_array( $input ) ? $input : array() );

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
			case 'wcpay_confirmation_token':
				$_POST['wcpay-confirmation-token'] = $value;
				$data['wcpay-confirmation-token'] = $value;
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
	'graphql_woocommerce_before_checkout',
	function ( $args, $input ) {
		unset( $args );

		try {
			motorock_wcpay_prepare_checkout_request( is_array( $input ) ? $input : array() );
		} catch ( Exception $exception ) {
			motorock_wcpay_store_last_payment_error( $exception->getMessage() );
			throw new \GraphQL\Error\UserError( $exception->getMessage() );
		}
	},
	10,
	2
);

add_action(
	'woocommerce_checkout_order_processed',
	function ( $order_id, $data, $order ) {
		unset( $order_id, $data );

		if ( ! $order instanceof WC_Order ) {
			return;
		}

		try {
			motorock_wcpay_prepare_checkout_request(
				array(
					'paymentMethod' => $order->get_payment_method(),
					'metaData'      => array(
						array(
							'key'   => 'wcpay_payment_method',
							'value' => (string) $order->get_meta( 'wcpay_payment_method' ),
						),
						array(
							'key'   => 'wcpay_confirmation_token',
							'value' => (string) $order->get_meta( 'wcpay_confirmation_token' ),
						),
						array(
							'key'   => 'wcpay_fraud_prevention_token',
							'value' => (string) $order->get_meta( 'wcpay_fraud_prevention_token' ),
						),
					),
				),
				$order
			);
		} catch ( Exception $exception ) {
			motorock_wcpay_store_last_payment_error( $exception->getMessage() );
			throw $exception;
		}
	},
	5,
	3
);

add_action(
	'woocommerce_payments_order_failed',
	function ( $order, $exception ) {
		if ( ! $exception instanceof Exception ) {
			return;
		}

		$raw_message     = wp_strip_all_tags( (string) $exception->getMessage() );
		$display_message = class_exists( 'WC_Payments_Utils' )
			? WC_Payments_Utils::get_filtered_error_message( $exception )
			: $raw_message;

		motorock_wcpay_record_payment_error( $order, $raw_message, $display_message );
	},
	10,
	2
);

add_action(
	'wcpay_update_payment_result_on_error',
	function ( $exception, $order ) {
		if ( ! $exception instanceof Exception ) {
			return;
		}

		$raw_message     = wp_strip_all_tags( (string) $exception->getMessage() );
		$display_message = class_exists( 'WC_Payments_Utils' )
			? WC_Payments_Utils::get_filtered_error_message( $exception )
			: $raw_message;

		motorock_wcpay_record_payment_error( $order, $raw_message, $display_message );
	},
	10,
	2
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

		register_rest_route(
			'motorock/v1',
			'/woo-payments/last-error',
			array(
				'methods'             => 'GET',
				'callback'            => 'motorock_rest_wcpay_last_error',
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			'motorock/v1',
			'/woo-payments/order-error/(?P<order_id>\d+)',
			array(
				'methods'             => 'GET',
				'callback'            => 'motorock_rest_wcpay_order_error',
				'permission_callback' => '__return_true',
			)
		);
	},
	999
);

add_action(
	'rest_api_init',
	function () {
		motorock_wcpay_ensure_storefront_domain_registered();
	},
	1000
);

function motorock_rest_wcpay_last_error( WP_REST_Request $request ) {
	unset( $request );

	return array(
		'message' => motorock_wcpay_take_last_payment_error(),
	);
}

function motorock_rest_wcpay_order_error( WP_REST_Request $request ) {
	$order_id = absint( $request->get_param( 'order_id' ) );
	if ( $order_id <= 0 ) {
		return new WP_Error(
			'invalid_order_id',
			'Invalid order ID.',
			array( 'status' => 400 )
		);
	}

	$order = wc_get_order( $order_id );
	if ( ! $order instanceof WC_Order ) {
		return new WP_Error(
			'order_not_found',
			'Order not found.',
			array( 'status' => 404 )
		);
	}

	if ( $order->get_payment_method() !== 'woocommerce_payments' ) {
		return array( 'message' => '' );
	}

	$message = (string) $order->get_meta( '_motorock_payment_error' );
	if ( $message === '' ) {
		$notes = wc_get_order_notes(
			array(
				'order_id' => $order_id,
				'limit'    => 5,
				'orderby'  => 'date_created',
				'order'    => 'DESC',
			)
		);
		foreach ( $notes as $note ) {
			$content = wp_strip_all_tags( $note->content );
			if ( stripos( $content, 'failed' ) !== false ) {
				$message = $content;
				break;
			}
		}
	}

	return array(
		'message' => $message,
	);
}

function motorock_rest_wcpay_config( WP_REST_Request $request ) {
	unset( $request );

	try {
		if ( ! motorock_wcpay_is_available() ) {
			return new WP_Error(
				'wcpay_unavailable',
				'WooCommerce Payments is not available.',
				array( 'status' => 503 )
			);
		}

		motorock_wcpay_bootstrap_session();

		$gateway = null;
		if ( function_exists( 'WC' ) && WC()->payment_gateways() ) {
			$gateway = WC()->payment_gateways()->payment_gateways()['woocommerce_payments'] ?? null;
		}

		$fraud_prevention_enabled = false;
		$fraud_prevention_token   = '';
		try {
			$fraud_prevention_enabled = motorock_wcpay_fraud_prevention_enabled();
			$fraud_prevention_token   = motorock_wcpay_fraud_prevention_token();
		} catch ( Throwable $throwable ) {
			unset( $throwable );
		}

		return rest_ensure_response(
			array(
				'publishableKey'         => motorock_wcpay_publishable_key(),
				'stripeAccountId'        => motorock_wcpay_stripe_account_id(),
				'testMode'               => WC_Payments::mode()->is_test(),
				'gatewayEnabled'         => $gateway instanceof WC_Payment_Gateway && $gateway->enabled === 'yes',
				'fraudPreventionEnabled' => $fraud_prevention_enabled,
				'fraudPreventionToken'   => $fraud_prevention_token,
				'storefrontDomain'       => motorock_wcpay_storefront_host(),
				'storefrontDomainStatus' => motorock_wcpay_read_storefront_domain_status(),
			)
		);
	} catch ( Throwable $throwable ) {
		return new WP_Error(
			'wcpay_config_failed',
			$throwable->getMessage(),
			array( 'status' => 500 )
		);
	}
}
