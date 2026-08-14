<?php
/**
 * Plugin Name: Motorock Headless Checkout
 * Description: Bridges headless GraphQL checkout to Montonio for WooCommerce (pickup points + payment methods).
 * Version: 1.2.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-headless-montonio.php
 */

defined( 'ABSPATH' ) || exit;

function motorock_get_storefront_url() {
	if ( defined( 'MOTOROCK_STOREFRONT_URL' ) && MOTOROCK_STOREFRONT_URL ) {
		return rtrim( MOTOROCK_STOREFRONT_URL, '/' );
	}

	$env = getenv( 'MOTOROCK_STOREFRONT_URL' );
	if ( $env ) {
		return rtrim( $env, '/' );
	}

	return 'https://motorock.eu';
}

function motorock_get_checkout_locale( WC_Order $order ) {
	$locale = (string) $order->get_meta( 'checkout_locale' );
	if ( $locale === '' ) {
		$locale = (string) $order->get_meta( 'wpml_language' );
	}

	if ( ! in_array( $locale, array( 'en', 'et' ), true ) ) {
		$locale = 'et';
	}

	return $locale;
}

/**
 * Montonio customer return lands on the Next.js storefront, which proxies the
 * order-token back to Woo for payment completion.
 */
add_filter(
	'wc_montonio_return_url',
	function ( $url, $payment_method_id ) {
		unset( $url );

		return add_query_arg(
			array(
				'gateway' => $payment_method_id,
			),
			trailingslashit( motorock_get_storefront_url() ) . 'order/payment-return'
		);
	},
	10,
	2
);

add_filter(
	'wc_montonio_before_order_data_submission',
	function ( array $order_data, $order ) {
		if ( ! $order instanceof WC_Order ) {
			return $order_data;
		}

		$locale = motorock_get_checkout_locale( $order );

		$order_data['returnUrl'] = add_query_arg(
			array(
				'gateway' => $order->get_payment_method(),
				'locale'  => $locale,
			),
			trailingslashit( motorock_get_storefront_url() ) . 'order/payment-return'
		);

		return $order_data;
	},
	5,
	2
);

add_filter(
	'woocommerce_get_return_url',
	function ( $return_url, $order ) {
		unset( $return_url );

		if ( ! $order instanceof WC_Order ) {
			return motorock_get_storefront_url();
		}

		$locale = motorock_get_checkout_locale( $order );

		return add_query_arg(
			array(
				'order' => $order->get_id(),
				'key'   => $order->get_order_key(),
			),
			trailingslashit( motorock_get_storefront_url() ) . $locale . '/order/thank-you'
		);
	},
	10,
	2
);

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'motorock/v1',
			'/order-summary',
			array(
				'methods'             => 'GET',
				'callback'            => 'motorock_rest_order_summary',
				'permission_callback' => '__return_true',
				'args'                => array(
					'order' => array(
						'required' => true,
						'type'     => 'integer',
					),
					'key'   => array(
						'required' => true,
						'type'     => 'string',
					),
				),
			)
		);

		register_rest_route(
			'motorock/v1',
			'/thank-you-key',
			array(
				'methods'             => 'GET',
				'callback'            => 'motorock_rest_thank_you_key',
				'permission_callback' => '__return_true',
				'args'                => array(
					'order' => array(
						'required' => true,
						'type'     => 'integer',
					),
				),
			)
		);
	}
);

function motorock_get_internal_secret() {
	if ( defined( 'MOTOROCK_INTERNAL_SECRET' ) && MOTOROCK_INTERNAL_SECRET ) {
		return (string) MOTOROCK_INTERNAL_SECRET;
	}

	$env = getenv( 'MOTOROCK_INTERNAL_SECRET' );
	if ( $env ) {
		return (string) $env;
	}

	return '';
}

function motorock_rest_thank_you_key( WP_REST_Request $request ) {
	$provided = (string) $request->get_header( 'x-motorock-internal-secret' );
	$expected = motorock_get_internal_secret();

	if ( $expected === '' || ! hash_equals( $expected, $provided ) ) {
		return new WP_Error( 'unauthorized', 'Unauthorized', array( 'status' => 401 ) );
	}

	$order = wc_get_order( (int) $request->get_param( 'order' ) );

	if ( ! $order ) {
		return new WP_Error( 'invalid_order', 'Order not found', array( 'status' => 404 ) );
	}

	$allowed_statuses = array( 'pending', 'on-hold', 'processing', 'completed' );
	if ( ! in_array( $order->get_status(), $allowed_statuses, true ) ) {
		return new WP_Error( 'invalid_status', 'Order not available', array( 'status' => 403 ) );
	}

	return array(
		'key'           => $order->get_order_key(),
		'locale'        => motorock_get_checkout_locale( $order ),
		'paymentMethod' => $order->get_payment_method(),
	);
}

function motorock_rest_order_summary( WP_REST_Request $request ) {
	$order = wc_get_order( (int) $request->get_param( 'order' ) );

	if ( ! $order || ! hash_equals( $order->get_order_key(), (string) $request->get_param( 'key' ) ) ) {
		return new WP_Error( 'invalid_order', 'Order not found', array( 'status' => 404 ) );
	}

	$items = array();
	foreach ( $order->get_items() as $item ) {
		if ( ! $item instanceof WC_Order_Item_Product ) {
			continue;
		}

		$product = $item->get_product();

		$items[] = array(
			'name'      => $item->get_name(),
			'quantity'  => (int) $item->get_quantity(),
			'total'     => (float) wc_format_decimal( $item->get_total() + $item->get_total_tax(), 2 ),
			'productId' => $product ? (int) $product->get_id() : (int) $item->get_product_id(),
			'sku'       => $product ? (string) $product->get_sku() : '',
		);
	}

	$shipping_names = array();
	foreach ( $order->get_shipping_methods() as $shipping_line ) {
		$shipping_names[] = $shipping_line->get_name();
	}

	return array(
		'orderNumber'     => $order->get_order_number(),
		'status'          => $order->get_status(),
		'email'           => $order->get_billing_email(),
		'total'           => (float) $order->get_total(),
		'currency'        => $order->get_currency(),
		'paymentMethod'   => $order->get_payment_method_title(),
		'shippingMethod'  => implode( ', ', array_filter( $shipping_names ) ),
		'items'           => $items,
	);
}

/**
 * Montonio classic checkout validates $_POST['montonio_pickup_point'] before GraphQL
 * order meta is applied. Map CheckoutInput metaData into $_POST for headless checkout.
 */
add_filter(
	'woocommerce_checkout_posted_data',
	function ( $data, $input, $context, $info ) {
		unset( $context, $info );

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
				case 'montonio_pickup_point':
				case '_montonio_pickup_point_uuid':
					$_POST['montonio_pickup_point'] = $value;
					$data['montonio_pickup_point']  = $value;
					break;
				case 'montonio_payments_preselected_bank':
					$_POST['montonio_payments_preselected_bank'] = $value;
					$data['montonio_payments_preselected_bank']  = $value;
					break;
				case 'montonio_payments_preferred_country':
				case 'montonio_preferred_country':
					$_POST['montonio_payments_preferred_country'] = $value;
					$data['montonio_payments_preferred_country']  = $value;
					break;
			}
		}

		if ( ! empty( $input['paymentMethod'] ) ) {
			$_POST['payment_method'] = sanitize_text_field( (string) $input['paymentMethod'] );
		}

		return $data;
	},
	5,
	4
);

add_filter(
	'wc_montonio_before_order_data_submission',
	function ( array $order_data, $order ) {
		if ( ! $order instanceof WC_Order ) {
			return $order_data;
		}

		$provider = (string) $order->get_meta( 'montonio_preferred_provider' );
		if ( $provider === '' ) {
			return $order_data;
		}

		$display_names = array(
			'cardPayments' => __( 'Card payment', 'montonio-for-woocommerce' ),
			'mobilePay'    => 'MobilePay',
			'blik'         => 'BLIK',
			'bnpl'         => __( 'Buy now, pay later', 'montonio-for-woocommerce' ),
			'hirePurchase' => __( 'Hire purchase', 'montonio-for-woocommerce' ),
		);

		if ( $provider !== 'paymentInitiation' ) {
			$order_data['payment']['method']        = $provider;
			$order_data['payment']['methodDisplay'] = $display_names[ $provider ] ?? $provider;
			$order_data['payment']['methodOptions'] = null;

			return $order_data;
		}

		$method_options = $order_data['payment']['methodOptions'] ?? array();
		if ( ! is_array( $method_options ) ) {
			$method_options = array();
		}

		$bank = (string) $order->get_meta( 'montonio_payments_preselected_bank' );
		if ( $bank === '' ) {
			$bank = (string) $order->get_meta( 'montonio_preferred_bank' );
		}
		if ( $bank !== '' ) {
			$method_options['preferredProvider'] = $bank;
		}

		$country = (string) $order->get_meta( 'montonio_payments_preferred_country' );
		if ( $country === '' ) {
			$country = (string) $order->get_meta( 'montonio_preferred_country' );
		}
		if ( $country !== '' ) {
			$method_options['preferredCountry'] = $country;
		}

		$order_data['payment']['methodOptions'] = $method_options;

		return $order_data;
	},
	10,
	2
);
