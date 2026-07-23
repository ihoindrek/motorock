<?php
/**
 * Plugin Name: Motorock Headless Public Lockdown
 * Description: Hides the WordPress/WooCommerce storefront on the backend domain; keeps admin, GraphQL, REST, and payment callbacks working.
 * Version: 1.0.0
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

	return false;
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
		$locale   = 'en';

		if ( function_exists( 'wc_get_order' ) && function_exists( 'motorock_get_checkout_locale' ) ) {
			$order = wc_get_order( $order_id );
			if ( $order instanceof WC_Order ) {
				$locale = motorock_get_checkout_locale( $order );
			}
		}

		return add_query_arg(
			array(
				'order' => $order_id,
				'key'   => $key,
			),
			$storefront . '/' . $locale . '/order/thank-you'
		);
	}

	return $storefront . '/en';
}

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
