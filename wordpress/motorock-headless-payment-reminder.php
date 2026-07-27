<?php
/**
 * Plugin Name: Motorock Abandoned Payment Reminder
 * Description: Emails buyers whose payment never completed (pending/failed orders) with a link that restores their cart on the headless storefront.
 * Version: 1.1.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-headless-payment-reminder.php
 * Requires motorock-headless-montonio.php for the storefront URL / locale helpers.
 *
 * Timing: orders aged 30 minutes … 72 hours, status pending/failed, once per order.
 * Scheduling: Action Scheduler (preferred) with WP-Cron fallback.
 */

defined( 'ABSPATH' ) || exit;

const MOTOROCK_REMINDER_META      = '_motorock_payment_reminder_sent';
const MOTOROCK_REMINDER_MIN_AGE   = 30 * MINUTE_IN_SECONDS; // Wait before nudging.
const MOTOROCK_REMINDER_MAX_AGE   = 3 * DAY_IN_SECONDS;     // Too old = stale intent.
const MOTOROCK_REMINDER_BATCH     = 30;
const MOTOROCK_REMINDER_CRON_HOOK = 'motorock_payment_reminder_cron';

/* -------------------------------------------------------------------------
 * Cart restore REST endpoint
 * ---------------------------------------------------------------------- */

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'motorock/v1',
			'/order-restore',
			array(
				'methods'             => 'GET',
				'callback'            => 'motorock_rest_order_restore',
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

		// Manual / external cron trigger:
		// GET /wp-json/motorock/v1/payment-reminder-run?secret=YOUR_SECRET
		register_rest_route(
			'motorock/v1',
			'/payment-reminder-run',
			array(
				'methods'             => 'GET',
				'callback'            => 'motorock_rest_payment_reminder_run',
				'permission_callback' => 'motorock_rest_payment_reminder_permission',
			)
		);
	}
);

function motorock_reminder_run_secret() {
	if ( defined( 'MOTOROCK_REMINDER_SECRET' ) && MOTOROCK_REMINDER_SECRET ) {
		return (string) MOTOROCK_REMINDER_SECRET;
	}

	$env = getenv( 'MOTOROCK_REMINDER_SECRET' );
	if ( $env ) {
		return (string) $env;
	}

	// Stable per-site fallback so the endpoint works before a custom secret is set.
	return hash_hmac( 'sha256', 'motorock-payment-reminder', wp_salt( 'auth' ) );
}

function motorock_rest_payment_reminder_permission( WP_REST_Request $request ) {
	$provided = (string) $request->get_param( 'secret' );
	$expected = motorock_reminder_run_secret();

	return $provided !== '' && hash_equals( $expected, $provided );
}

function motorock_rest_payment_reminder_run() {
	$sent = motorock_send_payment_reminders();

	return array(
		'sent'    => $sent,
		'message' => sprintf( 'Payment reminder run finished. Emails sent: %d.', $sent ),
	);
}

function motorock_restore_product_type( $product_id ) {
	$terms = get_the_terms( $product_id, 'product_cat' );
	if ( ! is_array( $terms ) ) {
		return 'equipment';
	}

	foreach ( $terms as $term ) {
		if ( 'motorcycles' === $term->slug ) {
			return 'motorcycle';
		}
		$parent = $term->parent ? get_term( $term->parent, 'product_cat' ) : null;
		if ( $parent && ! is_wp_error( $parent ) && 'motorcycles' === $parent->slug ) {
			return 'motorcycle';
		}
	}

	return 'equipment';
}

function motorock_restore_item_attribute( WC_Order_Item_Product $item, array $keys ) {
	foreach ( $item->get_formatted_meta_data( '_', true ) as $meta ) {
		$label = strtolower( wp_strip_all_tags( (string) $meta->display_key ) );
		$label = str_replace( 'pa_', '', $label );
		if ( in_array( $label, $keys, true ) ) {
			return trim( wp_strip_all_tags( (string) $meta->display_value ) );
		}
	}

	return '';
}

function motorock_restore_order_lines( WC_Order $order ) {
	$lines = array();

	foreach ( $order->get_items() as $item ) {
		if ( ! $item instanceof WC_Order_Item_Product ) {
			continue;
		}

		$product_id = $item->get_product_id();
		$parent     = wc_get_product( $product_id );
		if ( ! $parent ) {
			continue;
		}

		$quantity = max( 1, (int) $item->get_quantity() );
		$size     = motorock_restore_item_attribute( $item, array( 'size', 'suurus' ) );
		$color    = motorock_restore_item_attribute( $item, array( 'color', 'colour', 'värv', 'varv', 'finish' ) );
		$image_id = $parent->get_image_id();

		$line = array(
			'slug'      => $parent->get_slug(),
			'name'      => $parent->get_name(),
			'price'     => (float) wc_format_decimal(
				( $item->get_total() + $item->get_total_tax() ) / $quantity,
				2
			),
			'image'     => $image_id ? (string) wp_get_attachment_image_url( $image_id, 'woocommerce_single' ) : '',
			'type'      => motorock_restore_product_type( $product_id ),
			'quantity'  => $quantity,
			'productId' => (int) $product_id,
		);

		if ( $size !== '' ) {
			$line['size'] = $size;
		}
		if ( $color !== '' ) {
			$line['color'] = $color;
		}
		if ( $item->get_variation_id() ) {
			$line['variationId'] = (int) $item->get_variation_id();
		}

		$lines[] = $line;
	}

	return $lines;
}

function motorock_rest_order_restore( WP_REST_Request $request ) {
	$order = wc_get_order( (int) $request->get_param( 'order' ) );

	if ( ! $order || ! hash_equals( $order->get_order_key(), (string) $request->get_param( 'key' ) ) ) {
		return new WP_Error( 'invalid_order', 'Order not found', array( 'status' => 404 ) );
	}

	// Only unfinished orders can be restored; a paid order should not
	// repopulate the cart when its email link is clicked again.
	if ( ! in_array( $order->get_status(), array( 'pending', 'failed', 'cancelled' ), true ) ) {
		return new WP_Error( 'order_completed', 'Order already completed', array( 'status' => 409 ) );
	}

	return array(
		'orderNumber' => $order->get_order_number(),
		'status'      => $order->get_status(),
		'lines'       => motorock_restore_order_lines( $order ),
	);
}

/* -------------------------------------------------------------------------
 * Scheduling — Action Scheduler first, WP-Cron as fallback
 * ---------------------------------------------------------------------- */

function motorock_schedule_payment_reminders() {
	if ( function_exists( 'as_next_scheduled_action' ) && function_exists( 'as_schedule_recurring_action' ) ) {
		if ( ! as_next_scheduled_action( MOTOROCK_REMINDER_CRON_HOOK ) ) {
			as_schedule_recurring_action(
				time() + MINUTE_IN_SECONDS,
				HOUR_IN_SECONDS,
				MOTOROCK_REMINDER_CRON_HOOK,
				array(),
				'motorock'
			);
		}

		// Avoid duplicate WP-Cron events when Action Scheduler is available.
		$timestamp = wp_next_scheduled( MOTOROCK_REMINDER_CRON_HOOK );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, MOTOROCK_REMINDER_CRON_HOOK );
		}

		return;
	}

	if ( ! wp_next_scheduled( MOTOROCK_REMINDER_CRON_HOOK ) ) {
		wp_schedule_event( time() + MINUTE_IN_SECONDS, 'hourly', MOTOROCK_REMINDER_CRON_HOOK );
	}
}

add_action( 'init', 'motorock_schedule_payment_reminders', 20 );
add_action( MOTOROCK_REMINDER_CRON_HOOK, 'motorock_send_payment_reminders' );

/**
 * Find eligible unfinished orders and send reminders.
 *
 * @return int Number of emails successfully sent.
 */
function motorock_send_payment_reminders() {
	if ( ! function_exists( 'wc_get_orders' ) ) {
		return 0;
	}

	$now     = time();
	$orders  = wc_get_orders(
		array(
			'status'       => array( 'pending', 'failed' ),
			'date_created' => ( $now - MOTOROCK_REMINDER_MAX_AGE ) . '...' . ( $now - MOTOROCK_REMINDER_MIN_AGE ),
			'limit'        => MOTOROCK_REMINDER_BATCH,
			'orderby'      => 'date',
			'order'        => 'ASC',
		)
	);

	$sent = 0;

	foreach ( $orders as $order ) {
		if ( ! $order instanceof WC_Order ) {
			continue;
		}

		// Filter in PHP so we don't depend on HPOS/legacy meta_query quirks.
		if ( $order->get_meta( MOTOROCK_REMINDER_META ) ) {
			continue;
		}

		if ( motorock_maybe_send_payment_reminder( $order ) ) {
			++$sent;
		}
	}

	return $sent;
}

/** A newer paid order from the same buyer means they already completed the purchase. */
function motorock_buyer_completed_later_order( WC_Order $order ) {
	$email = $order->get_billing_email();
	if ( ! $email ) {
		return false;
	}

	$paid = wc_get_orders(
		array(
			'status'        => array( 'processing', 'completed', 'on-hold' ),
			'billing_email' => $email,
			'date_created'  => '>' . ( $order->get_date_created() ? $order->get_date_created()->getTimestamp() : 0 ),
			'limit'         => 1,
			'return'        => 'ids',
		)
	);

	return ! empty( $paid );
}

/**
 * @return bool True when an email was successfully handed to wp_mail / WC mailer.
 */
function motorock_maybe_send_payment_reminder( WC_Order $order ) {
	$email = $order->get_billing_email();
	if ( ! $email ) {
		$order->add_order_note( 'Motorock: payment reminder skipped (no billing email).' );
		$order->update_meta_data( MOTOROCK_REMINDER_META, 'skipped_no_email:' . time() );
		$order->save();
		return false;
	}

	if ( motorock_buyer_completed_later_order( $order ) ) {
		$order->add_order_note( 'Motorock: payment reminder skipped (newer paid order for same email).' );
		$order->update_meta_data( MOTOROCK_REMINDER_META, 'skipped_later_paid:' . time() );
		$order->save();
		return false;
	}

	$locale     = function_exists( 'motorock_get_checkout_locale' ) ? motorock_get_checkout_locale( $order ) : 'en';
	$storefront = function_exists( 'motorock_get_storefront_url' ) ? motorock_get_storefront_url() : 'https://motorock.eu';

	$restore_url = add_query_arg(
		array(
			'restore' => $order->get_id(),
			'key'     => $order->get_order_key(),
		),
		$storefront . '/' . $locale . '/checkout'
	);

	$first_name = $order->get_billing_first_name();

	if ( 'et' === $locale ) {
		$subject  = sprintf( 'Sinu tellimus #%s jäi pooleli — MotoRock', $order->get_order_number() );
		$heading  = 'Sinu ost jäi pooleli';
		$greeting = $first_name ? sprintf( 'Tere, %s!', $first_name ) : 'Tere!';
		$intro    = sprintf(
			'Märkasime, et sinu tellimuse #%s makse jäi lõpetamata. Tooted on endiselt saadaval — saad ostu mugavalt lõpetada alloleva lingi kaudu.',
			$order->get_order_number()
		);
		$cta      = 'Jätka ostuga';
		$outro    = 'Kui sa ei soovi tellimust lõpetada või makse on juba tehtud, võid selle kirja tähelepanuta jätta. Küsimuste korral vasta sellele kirjale või kirjuta info@motorock.eu.';
	} else {
		$subject  = sprintf( 'Your order #%s is waiting — MotoRock', $order->get_order_number() );
		$heading  = 'Your purchase is not finished';
		$greeting = $first_name ? sprintf( 'Hi %s!', $first_name ) : 'Hi!';
		$intro    = sprintf(
			'We noticed the payment for your order #%s was not completed. Your items are still available — you can finish your purchase using the link below.',
			$order->get_order_number()
		);
		$cta      = 'Resume your order';
		$outro    = 'If you no longer want the order or have already paid, feel free to ignore this email. Questions? Just reply to this email or write to info@motorock.eu.';
	}

	$items_html = '';
	foreach ( $order->get_items() as $item ) {
		$items_html .= sprintf(
			'<li style="margin:0 0 6px;">%s × %d</li>',
			esc_html( $item->get_name() ),
			(int) $item->get_quantity()
		);
	}

	$body = sprintf(
		'<p>%s</p><p>%s</p><ul style="padding-left:18px;">%s</ul><p style="margin:24px 0;"><a href="%s" style="background:#e84e1b;color:#ffffff;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;">%s</a></p><p style="color:#777777;font-size:13px;">%s</p>',
		esc_html( $greeting ),
		esc_html( $intro ),
		$items_html,
		esc_url( $restore_url ),
		esc_html( $cta ),
		esc_html( $outro )
	);

	$mailer  = WC()->mailer();
	$wrapped = $mailer->wrap_message( $heading, $body );
	$sent    = (bool) $mailer->send( $email, $subject, $wrapped );

	if ( $sent ) {
		$order->update_meta_data( MOTOROCK_REMINDER_META, time() );
		$order->add_order_note( 'Motorock: payment reminder email sent to ' . $email . '.' );
		$order->save();
		return true;
	}

	$order->add_order_note( 'Motorock: payment reminder email FAILED for ' . $email . ' (will retry on next run).' );
	$order->save();
	return false;
}
