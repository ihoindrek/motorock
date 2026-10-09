<?php
/**
 * Motorock DHL Express shipping — order helpers.
 *
 * @package Motorock
 */

defined( 'ABSPATH' ) || exit;

function motorock_dhl_express_order_uses_method( WC_Order $order ): bool {
	foreach ( $order->get_shipping_methods() as $line ) {
		if ( $line->get_method_id() === 'motorock_dhl_express' ) {
			return true;
		}
	}

	return false;
}

function motorock_dhl_express_stamp_order( WC_Order $order ): void {
	if ( ! motorock_dhl_express_order_uses_method( $order ) ) {
		return;
	}

	$order->update_meta_data( '_motorock_dhl_express', 'yes' );
	$order->update_meta_data( '_motorock_fulfilment_carrier', 'dhl_express' );
}
