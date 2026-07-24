<?php
/**
 * Plugin Name: Motorock Headless Public Lockdown
 * Description: Hides the WordPress/WooCommerce storefront on the backend domain; keeps admin, GraphQL, REST, and payment callbacks working.
 * Version: 1.3.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-headless-lockdown.php
 */

defined( 'ABSPATH' ) || exit;

function motorock_lockdown_storefront_url() {
	if ( function_exists( 'motorock_get_storefront_url' ) ) {
		return motorock_get_storefront_url();
	}

	if ( defined( 'MOTOROCK_STOREFRONT_URL' ) && MOTOROCK_STOREFRONT_URL ) {
		return rtrim( MOTOROCK_STOREFRONT_URL, '/' );
	}

	$env = getenv( 'MOTOROCK_STOREFRONT_URL' );
	if ( $env ) {
		return rtrim( $env, '/' );
	}

	return 'https://motorock.eu';
}

function motorock_lockdown_request_path() {
	$uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';

	return (string) strtok( $uri, '?' );
}

function motorock_lockdown_is_allowed_request() {
	if ( is_admin() ) {
		return true;
	}

	if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
		return true;
	}

	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		return true;
	}

	if ( function_exists( 'motorock_is_graphql_request' ) && motorock_is_graphql_request() ) {
		return true;
	}

	if ( function_exists( 'is_graphql_http_request' ) && is_graphql_http_request() ) {
		return true;
	}

	$path = motorock_lockdown_request_path();

	if ( $path === '/graphql' || strpos( $path, '/graphql/' ) === 0 ) {
		return true;
	}

	if ( strpos( $path, '/wp-json/' ) === 0 ) {
		return true;
	}

	if ( strpos( $path, '/wp-content/' ) === 0 || strpos( $path, '/wp-includes/' ) === 0 ) {
		return true;
	}

	if ( $path === '/wp-login.php' || strpos( $path, '/wp-login.php' ) === 0 ) {
		return true;
	}

	if ( $path === '/wp-cron.php' ) {
		return true;
	}

	if ( ! empty( $_GET['wc-api'] ) ) {
		return true;
	}

	// WooCommerce frontend AJAX endpoints. PayPal Payments returns the buyer
	// to `?wc-ajax=ppc-return-url` after approval to capture the payment and
	// mark the order paid — blocking it leaves orders stuck in pending.
	if ( ! empty( $_GET['wc-ajax'] ) ) {
		return true;
	}

	return false;
}

function motorock_lockdown_order_locale( $order_id ) {
	if ( $order_id && function_exists( 'wc_get_order' ) && function_exists( 'motorock_get_checkout_locale' ) ) {
		$order = wc_get_order( $order_id );
		if ( $order instanceof WC_Order ) {
			return motorock_get_checkout_locale( $order );
		}
	}

	return 'en';
}

function motorock_lockdown_redirect_target() {
	$storefront = motorock_lockdown_storefront_url();
	$path       = motorock_lockdown_request_path();

	// Payment gateways (e.g. PayPal) may send the buyer back to the classic
	// order-received URL; forward them to the storefront thank-you page with
	// the order context intact instead of dropping them on the homepage.
	if ( preg_match( '#/order-received/(\d+)#', $path, $matches ) ) {
		$order_id = (int) $matches[1];
		$key      = isset( $_GET['key'] ) ? sanitize_text_field( (string) wp_unslash( $_GET['key'] ) ) : '';

		return add_query_arg(
			array(
				'order' => $order_id,
				'key'   => $key,
			),
			$storefront . '/' . motorock_lockdown_order_locale( $order_id ) . '/order/thank-you'
		);
	}

	// Cancelled payments (PayPal "Cancel and return") come back to the classic
	// cart/checkout page with cancel_order args; send the buyer back to the
	// storefront checkout with the same error marker the UI already localizes.
	if ( isset( $_GET['cancel_order'] ) ) {
		$order_id = isset( $_GET['order_id'] ) ? (int) $_GET['order_id'] : 0;

		return $storefront . '/' . motorock_lockdown_order_locale( $order_id )
			. '/checkout?payment_error=' . rawurlencode( 'Payment cancelled' );
	}

	// Any other classic cart/checkout URL: continue shopping on the storefront
	// checkout rather than the homepage.
	if ( preg_match( '#^/(cart|checkout|ostukorv|kassa)(/|$)#', $path ) ) {
		return $storefront . '/en/checkout';
	}

	return $storefront . '/en';
}

// wp_safe_redirect() only allows same-host targets by default and silently
// falls back to wp-admin for anything else — the storefront host must be
// whitelisted or every lockdown redirect ends up on /wp-admin/.
function motorock_lockdown_allowed_redirect_hosts( $hosts ) {
	$storefront_host = wp_parse_url( motorock_lockdown_storefront_url(), PHP_URL_HOST );
	if ( $storefront_host && ! in_array( $storefront_host, (array) $hosts, true ) ) {
		$hosts[] = $storefront_host;
	}

	return $hosts;
}
add_filter( 'allowed_redirect_hosts', 'motorock_lockdown_allowed_redirect_hosts' );

function motorock_lockdown_public_storefront() {
	if ( motorock_lockdown_is_allowed_request() ) {
		return;
	}

	wp_safe_redirect( motorock_lockdown_redirect_target(), 301 );
	exit;
}
add_action( 'template_redirect', 'motorock_lockdown_public_storefront', 0 );

function motorock_lockdown_discourage_indexing() {
	return 0;
}
add_filter( 'pre_option_blog_public', 'motorock_lockdown_discourage_indexing' );
