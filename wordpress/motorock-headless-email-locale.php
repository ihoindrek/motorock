<?php
/**
 * Plugin Name: Motorock Headless Email Locale
 * Description: Sends WooCommerce customer emails in the checkout language (checkout_locale / wpml_language).
 * Version: 1.0.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-headless-email-locale.php
 * Requires motorock-headless-montonio.php for motorock_get_checkout_locale().
 */

defined( 'ABSPATH' ) || exit;

/**
 * Map storefront language codes to WordPress locales.
 */
function motorock_email_wp_locale( $lang ) {
	if ( 'et' === $lang ) {
		return 'et';
	}

	$site = function_exists( 'get_locale' ) ? get_locale() : 'en_US';
	if ( is_string( $site ) && str_starts_with( $site, 'en' ) ) {
		return $site;
	}

	return 'en_US';
}

/**
 * @var WC_Order|null
 */
function motorock_email_order_context( $order = null ) {
	static $current = null;

	if ( null !== $order ) {
		$current = $order instanceof WC_Order ? $order : null;
	}

	return $current;
}

function motorock_email_locale_state( $set = null ) {
	static $state = array(
		'switched'         => false,
		'wpml_previous'    => null,
		'plugin_locale_cb' => null,
	);

	if ( is_array( $set ) ) {
		$state = array_merge( $state, $set );
	}

	return $state;
}

/**
 * Keep WPML's order language meta in sync with the headless checkout locale.
 */
function motorock_sync_order_wpml_language( $order_id ) {
	$order = wc_get_order( $order_id );
	if ( ! $order instanceof WC_Order ) {
		return;
	}

	$locale = (string) $order->get_meta( 'checkout_locale' );
	if ( ! in_array( $locale, array( 'en', 'et' ), true ) ) {
		return;
	}

	if ( (string) $order->get_meta( 'wpml_language' ) === $locale ) {
		return;
	}

	$order->update_meta_data( 'wpml_language', $locale );
	$order->save_meta_data();
}

add_action( 'woocommerce_checkout_order_processed', 'motorock_sync_order_wpml_language', 20, 1 );
add_action( 'woocommerce_store_api_checkout_order_processed', 'motorock_sync_order_wpml_language', 20, 1 );
add_action( 'woocommerce_new_order', 'motorock_sync_order_wpml_language', 20, 1 );

/**
 * Remember which order an upcoming customer email belongs to.
 * WooCommerce calls setup_locale() before assigning $email->object, so we
 * capture the order from the notification hooks that fire just before trigger().
 *
 * @param int|WC_Order      $order_id Order id or object.
 * @param WC_Order|false|null $order    Optional order object.
 */
function motorock_capture_email_order( $order_id, $order = false ) {
	if ( $order instanceof WC_Order ) {
		motorock_email_order_context( $order );
		return;
	}

	if ( $order_id instanceof WC_Order ) {
		motorock_email_order_context( $order_id );
		return;
	}

	if ( $order_id ) {
		$resolved = wc_get_order( $order_id );
		if ( $resolved instanceof WC_Order ) {
			motorock_email_order_context( $resolved );
		}
	}
}

add_action(
	'woocommerce_init',
	function () {
		$actions = apply_filters(
			'woocommerce_email_actions',
			array(
				'woocommerce_order_status_pending_to_processing',
				'woocommerce_order_status_pending_to_completed',
				'woocommerce_order_status_pending_to_on-hold',
				'woocommerce_order_status_failed_to_processing',
				'woocommerce_order_status_failed_to_completed',
				'woocommerce_order_status_failed_to_on-hold',
				'woocommerce_order_status_cancelled_to_processing',
				'woocommerce_order_status_cancelled_to_completed',
				'woocommerce_order_status_on-hold_to_processing',
				'woocommerce_order_status_on-hold_to_completed',
				'woocommerce_order_status_completed',
				'woocommerce_order_status_failed',
				'woocommerce_order_status_cancelled',
				'woocommerce_order_status_refunded',
			)
		);

		foreach ( $actions as $action ) {
			add_action( $action . '_notification', 'motorock_capture_email_order', 1, 2 );
		}
	},
	20
);

add_action( 'woocommerce_before_resend_order_emails', 'motorock_capture_email_order', 1, 1 );
add_action( 'woocommerce_before_resend_order_emails', 'motorock_sync_order_wpml_language', 5, 1 );

/**
 * Resolve the order for the email currently being built.
 */
function motorock_resolve_email_order( $email ) {
	$context = motorock_email_order_context();
	if ( $context instanceof WC_Order ) {
		return $context;
	}

	if ( isset( $email->object ) && $email->object instanceof WC_Order ) {
		return $email->object;
	}

	return null;
}

/**
 * Switch WordPress + WooCommerce (+ WPML when present) to the order language.
 */
function motorock_switch_email_locale_for_order( WC_Order $order ) {
	$state = motorock_email_locale_state();
	if ( $state['switched'] ) {
		return;
	}

	$lang = function_exists( 'motorock_get_checkout_locale' )
		? motorock_get_checkout_locale( $order )
		: (string) $order->get_meta( 'checkout_locale' );

	if ( ! in_array( $lang, array( 'en', 'et' ), true ) ) {
		$lang = 'et';
	}

	$wp_locale = motorock_email_wp_locale( $lang );

	$wpml_previous = null;
	if ( has_action( 'wpml_switch_language' ) ) {
		$wpml_previous = apply_filters( 'wpml_current_language', null );
		do_action( 'wpml_switch_language', $lang );
	}

	$plugin_locale_cb = null;
	if ( function_exists( 'switch_to_locale' ) ) {
		switch_to_locale( $wp_locale );

		$plugin_locale_cb = static function () use ( $wp_locale ) {
			return $wp_locale;
		};
		add_filter( 'plugin_locale', $plugin_locale_cb );

		if ( function_exists( 'WC' ) && WC() ) {
			WC()->load_plugin_textdomain();
		}
	}

	motorock_email_locale_state(
		array(
			'switched'         => true,
			'wpml_previous'    => $wpml_previous,
			'plugin_locale_cb' => $plugin_locale_cb,
		)
	);
}

function motorock_restore_email_locale() {
	$state = motorock_email_locale_state();
	if ( ! $state['switched'] ) {
		return;
	}

	if ( $state['plugin_locale_cb'] ) {
		remove_filter( 'plugin_locale', $state['plugin_locale_cb'] );
	}

	if ( function_exists( 'restore_previous_locale' ) ) {
		restore_previous_locale();
	}

	if ( has_action( 'wpml_switch_language' ) ) {
		do_action( 'wpml_switch_language', $state['wpml_previous'] );
	}

	if ( function_exists( 'WC' ) && WC() ) {
		WC()->load_plugin_textdomain();
	}

	motorock_email_locale_state(
		array(
			'switched'         => false,
			'wpml_previous'    => null,
			'plugin_locale_cb' => null,
		)
	);
	motorock_email_order_context( false );
}

/**
 * Take over locale switching for customer emails so they follow checkout_locale
 * instead of the site default / admin user language.
 */
add_filter(
	'woocommerce_allow_switching_email_locale',
	function ( $allow, $email ) {
		if ( ! is_object( $email ) || ! method_exists( $email, 'is_customer_email' ) || ! $email->is_customer_email() ) {
			return $allow;
		}

		$order = motorock_resolve_email_order( $email );
		if ( ! $order instanceof WC_Order ) {
			return $allow;
		}

		motorock_switch_email_locale_for_order( $order );

		// We handled the switch — skip WooCommerce's site-locale switch.
		return false;
	},
	10,
	2
);

add_filter(
	'woocommerce_allow_restoring_email_locale',
	function ( $allow, $email ) {
		if ( ! is_object( $email ) || ! method_exists( $email, 'is_customer_email' ) || ! $email->is_customer_email() ) {
			return $allow;
		}

		$state = motorock_email_locale_state();
		if ( ! $state['switched'] ) {
			return $allow;
		}

		motorock_restore_email_locale();

		return false;
	},
	10,
	2
);
