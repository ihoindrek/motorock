<?php
/**
 * Plugin Name: Motorock Headless Order Admin
 * Description: Shows headless checkout payment/shipping details and failures on the WooCommerce order screen.
 * Version: 1.1.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-headless-order-admin.php
 */

defined( 'ABSPATH' ) || exit;

/**
 * @return array{id: string, title: string}|null
 */
function motorock_admin_resolve_payment_gateway( string $gateway_id ) {
	$gateway_id = sanitize_text_field( $gateway_id );
	if ( $gateway_id === '' ) {
		return null;
	}

	if ( function_exists( 'WC' ) && WC()->payment_gateways() ) {
		$gateways = WC()->payment_gateways()->payment_gateways();
		if ( ! empty( $gateways[ $gateway_id ] ) ) {
			return array(
				'id'    => $gateway_id,
				'title' => (string) $gateways[ $gateway_id ]->get_title(),
			);
		}
	}

	$labels = array(
		'woocommerce_payments'      => 'WooPayments (card)',
		'motorock_headless_pending' => 'Headless pending (internal)',
	);

	return array(
		'id'    => $gateway_id,
		'title' => $labels[ $gateway_id ] ?? $gateway_id,
	);
}

function motorock_admin_order_payment_failure_message( WC_Order $order ): string {
	$display = trim( (string) $order->get_meta( '_motorock_payment_error' ) );
	if ( $display !== '' ) {
		return $display;
	}

	foreach ( motorock_admin_recent_order_notes( $order ) as $content ) {
		if ( stripos( $content, 'failed to complete' ) !== false ) {
			return $content;
		}
		if ( stripos( $content, 'payment failed' ) !== false ) {
			return $content;
		}
	}

	return '';
}

/**
 * @return list<string>
 */
function motorock_admin_recent_order_notes( WC_Order $order ): array {
	$notes = wc_get_order_notes(
		array(
			'order_id' => $order->get_id(),
			'limit'    => 15,
			'orderby'  => 'date_created',
			'order'    => 'DESC',
		)
	);

	$lines = array();
	foreach ( $notes as $note ) {
		$lines[] = wp_strip_all_tags( (string) $note->content );
	}

	return $lines;
}

function motorock_admin_order_shipping_failure_message( WC_Order $order ): string {
	$stored = trim( (string) $order->get_meta( '_motorock_shipping_error' ) );
	if ( $stored !== '' ) {
		return $stored;
	}

	$montonio_reason = trim( (string) $order->get_meta( '_wc_montonio_shipping_shipment_status_reason' ) );
	if ( $montonio_reason !== '' ) {
		return $montonio_reason;
	}

	$patterns = array(
		'shipment failed',
		'failed to create',
		'label failed',
		'shipping failed',
		'montonio',
		'could not register',
		'invalid pickup',
		'pickup point',
	);

	foreach ( motorock_admin_recent_order_notes( $order ) as $content ) {
		$lower = strtolower( $content );
		foreach ( $patterns as $pattern ) {
			if ( strpos( $lower, $pattern ) === false ) {
				continue;
			}
			if ( stripos( $content, 'failed' ) !== false || stripos( $content, 'error' ) !== false ) {
				return $content;
			}
		}
	}

	return '';
}

function motorock_admin_montonio_shipment_status_is_warning( string $status ): bool {
	$status = strtolower( trim( $status ) );
	if ( $status === '' ) {
		return false;
	}

	$ok = array( 'registered', 'labelscreated', 'intransit', 'delivered', 'handedover' );

	return ! in_array( $status, $ok, true );
}

add_action(
	'woocommerce_admin_order_data_after_billing_address',
	static function ( WC_Order $order ): void {
		$intended_id  = trim( (string) $order->get_meta( 'motorock_headless_intended_payment_gateway' ) );
		$method_id    = (string) $order->get_payment_method();
		$method_title = (string) $order->get_payment_method_title();

		$intended = $intended_id !== '' ? motorock_admin_resolve_payment_gateway( $intended_id ) : null;
		$actual   = $method_id !== '' ? motorock_admin_resolve_payment_gateway( $method_id ) : null;

		$error     = motorock_admin_order_payment_failure_message( $order );
		$error_raw = trim( (string) $order->get_meta( '_motorock_payment_error_raw' ) );
		$intent_id = trim( (string) $order->get_meta( '_intent_id' ) );

		$show =
			$intended ||
			$error !== '' ||
			( $order->has_status( array( 'failed', 'pending' ) ) && $method_id !== '' );

		if ( ! $show ) {
			return;
		}

		echo '<div class="order_data_column" style="clear:both;padding-top:12px;">';
		echo '<h3>' . esc_html__( 'Headless checkout — payment', 'motorock' ) . '</h3>';

		if ( $intended ) {
			echo '<p><strong>' . esc_html__( 'Payment selected at checkout', 'motorock' ) . ':</strong> ';
			echo esc_html( $intended['title'] );
			echo ' <code style="font-size:11px;">' . esc_html( $intended['id'] ) . '</code></p>';
		} elseif ( $actual ) {
			echo '<p><strong>' . esc_html__( 'Payment method', 'motorock' ) . ':</strong> ';
			echo esc_html( $method_title !== '' ? $method_title : $actual['title'] );
			echo ' <code style="font-size:11px;">' . esc_html( $actual['id'] ) . '</code></p>';
		}

		if ( $intended && $actual && $intended['id'] !== $actual['id'] ) {
			echo '<p><strong>' . esc_html__( 'Recorded on order', 'motorock' ) . ':</strong> ';
			echo esc_html( $method_title !== '' ? $method_title : $actual['title'] );
			echo ' <code style="font-size:11px;">' . esc_html( $actual['id'] ) . '</code></p>';
		}

		if ( $error !== '' ) {
			echo '<p><strong>' . esc_html__( 'Payment failure', 'motorock' ) . ':</strong><br />';
			echo '<span style="color:#b32d2e;">' . esc_html( $error ) . '</span></p>';
		} elseif ( $order->has_status( 'failed' ) ) {
			echo '<p><strong>' . esc_html__( 'Payment failure', 'motorock' ) . ':</strong> ';
			echo esc_html__( 'No stored message — see order notes below.', 'motorock' );
			echo '</p>';
		}

		if ( $error_raw !== '' && $error_raw !== $error ) {
			echo '<p style="font-size:12px;color:#646970;"><strong>' . esc_html__( 'Raw error', 'motorock' ) . ':</strong> ';
			echo esc_html( $error_raw ) . '</p>';
		}

		if ( $intent_id !== '' ) {
			echo '<p style="font-size:12px;"><strong>Stripe PaymentIntent:</strong> ';
			echo '<code>' . esc_html( $intent_id ) . '</code></p>';
		}

		echo '</div>';
	},
	15,
	1
);

add_action(
	'woocommerce_admin_order_data_after_shipping_address',
	static function ( WC_Order $order ): void {
		$shipping_lines = $order->get_shipping_methods();
		if ( empty( $shipping_lines ) ) {
			return;
		}

		$pickup_name   = trim( (string) $order->get_meta( '_montonio_pickup_point_name' ) );
		$pickup_uuid   = trim( (string) $order->get_meta( '_montonio_pickup_point_uuid' ) );
		$carrier_point = trim( (string) $order->get_meta( '_wc_montonio_carrier_pickup_point_id' ) );
		$method_type   = trim( (string) $order->get_meta( '_wc_montonio_shipping_method_type' ) );
		$ship_status   = trim( (string) $order->get_meta( '_wc_montonio_shipping_shipment_status' ) );
		$ship_reason   = trim( (string) $order->get_meta( '_wc_montonio_shipping_shipment_status_reason' ) );
		$ship_id       = trim( (string) $order->get_meta( '_wc_montonio_shipping_shipment_id' ) );
		$is_dhl        = $order->get_meta( '_motorock_dhl_express' ) === 'yes';
		$ship_error    = motorock_admin_order_shipping_failure_message( $order );

		$needs_pickup = false;
		foreach ( $shipping_lines as $line ) {
			$mid = (string) $line->get_method_id();
			if (
				strpos( $mid, 'parcel' ) !== false ||
				strpos( $mid, 'pickup' ) !== false ||
				$method_type === 'pickupPoint'
			) {
				$needs_pickup = true;
				break;
			}
		}

		$missing_pickup = $needs_pickup && $pickup_uuid === '' && $order->has_status( array( 'processing', 'on-hold', 'completed' ) );

		echo '<div class="order_data_column" style="clear:both;padding-top:12px;">';
		echo '<h3>' . esc_html__( 'Headless checkout — shipping', 'motorock' ) . '</h3>';

		foreach ( $shipping_lines as $line ) {
			echo '<p><strong>' . esc_html__( 'Method', 'motorock' ) . ':</strong> ';
			echo esc_html( $line->get_name() );
			echo ' <code style="font-size:11px;">' . esc_html( (string) $line->get_method_id() ) . '</code></p>';
		}

		if ( $is_dhl ) {
			echo '<p><strong>' . esc_html__( 'Fulfillment', 'motorock' ) . ':</strong> ';
			echo esc_html__( 'DHL Express Commerce (not Montonio)', 'motorock' );
			echo '</p>';
		}

		if ( $pickup_name !== '' || $pickup_uuid !== '' ) {
			echo '<p><strong>' . esc_html__( 'Pickup point', 'motorock' ) . ':</strong> ';
			echo esc_html( $pickup_name !== '' ? $pickup_name : $pickup_uuid );
			if ( $carrier_point !== '' ) {
				echo ' <code style="font-size:11px;">' . esc_html( $carrier_point ) . '</code>';
			}
			echo '</p>';
		}

		if ( $missing_pickup ) {
			echo '<p><strong>' . esc_html__( 'Shipping issue', 'motorock' ) . ':</strong> ';
			echo '<span style="color:#b32d2e;">';
			echo esc_html__( 'Parcel locker shipping selected but no Montonio pickup point on the order.', 'motorock' );
			echo '</span></p>';
		}

		if ( $ship_status !== '' || $ship_id !== '' ) {
			echo '<p><strong>Montonio shipment:</strong> ';
			echo esc_html( $ship_status !== '' ? $ship_status : '—' );
			if ( $ship_id !== '' ) {
				echo ' <code style="font-size:11px;">' . esc_html( $ship_id ) . '</code>';
			}
			echo '</p>';
		}

		if ( $ship_reason !== '' ) {
			echo '<p><strong>' . esc_html__( 'Montonio status reason', 'motorock' ) . ':</strong> ';
			echo '<span style="color:#b32d2e;">' . esc_html( $ship_reason ) . '</span></p>';
		} elseif ( motorock_admin_montonio_shipment_status_is_warning( $ship_status ) ) {
			echo '<p><strong>' . esc_html__( 'Shipping note', 'motorock' ) . ':</strong> ';
			echo '<span style="color:#dba617;">';
			echo esc_html(
				sprintf(
					/* translators: %s Montonio shipment status */
					__( 'Unusual Montonio shipment status: %s', 'motorock' ),
					$ship_status
				)
			);
			echo '</span></p>';
		}

		if ( $ship_error !== '' && $ship_error !== $ship_reason ) {
			echo '<p><strong>' . esc_html__( 'Shipping failure', 'motorock' ) . ':</strong><br />';
			echo '<span style="color:#b32d2e;">' . esc_html( $ship_error ) . '</span></p>';
		}

		echo '</div>';
	},
	15,
	1
);
