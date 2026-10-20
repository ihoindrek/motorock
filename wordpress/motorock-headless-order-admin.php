<?php
/**
 * Plugin Name: Motorock Headless Order Admin
 * Description: Shows headless checkout payment method and last payment failure on the WooCommerce order screen.
 * Version: 1.0.0
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
		'woocommerce_payments'       => 'WooPayments (card)',
		'motorock_headless_pending'  => 'Headless pending (internal)',
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

	$notes = wc_get_order_notes(
		array(
			'order_id' => $order->get_id(),
			'limit'    => 12,
			'orderby'  => 'date_created',
			'order'    => 'DESC',
		)
	);

	foreach ( $notes as $note ) {
		$content = wp_strip_all_tags( (string) $note->content );
		if ( stripos( $content, 'failed to complete' ) !== false ) {
			return $content;
		}
		if ( stripos( $content, 'payment failed' ) !== false ) {
			return $content;
		}
	}

	return '';
}

add_action(
	'woocommerce_admin_order_data_after_billing_address',
	static function ( WC_Order $order ): void {
		$intended_id = trim( (string) $order->get_meta( 'motorock_headless_intended_payment_gateway' ) );
		$method_id   = (string) $order->get_payment_method();
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
		echo '<h3>' . esc_html__( 'Headless checkout (Motorock)', 'motorock' ) . '</h3>';

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
