<?php
/**
 * Motorock DHL Express shipping — shared country rules.
 *
 * @package Motorock
 */

defined( 'ABSPATH' ) || exit;

/**
 * EU member states minus Baltics, plus Norway and Switzerland.
 *
 * @return list<string> ISO 3166-1 alpha-2 uppercase.
 */
function motorock_dhl_express_allowed_country_codes(): array {
	static $cache = null;

	if ( is_array( $cache ) ) {
		return $cache;
	}

	$eu = array();
	if ( function_exists( 'WC' ) && WC()->countries ) {
		$eu = WC()->countries->get_european_union_countries();
	}

	if ( ! is_array( $eu ) ) {
		$eu = array();
	}

	$exclude = array( 'EE', 'LV', 'LT' );
	$extra   = array( 'NO', 'CH' );

	$allowed = array_diff( array_map( 'strtoupper', $eu ), $exclude );
	$allowed = array_merge( $allowed, $extra );

	$cache = array_values( array_unique( array_map( 'strtoupper', $allowed ) ) );
	sort( $cache );

	return $cache;
}

function motorock_dhl_express_is_country_allowed( string $country_code ): bool {
	$country_code = strtoupper( sanitize_text_field( $country_code ) );

	if ( strlen( $country_code ) !== 2 ) {
		return false;
	}

	return in_array( $country_code, motorock_dhl_express_allowed_country_codes(), true );
}

/**
 * Resolve shipping country from a Woo package or customer session.
 *
 * @param array<string, mixed> $package
 */
function motorock_dhl_express_destination_country( array $package ): string {
	if ( ! empty( $package['destination']['country'] ) ) {
		return strtoupper( (string) $package['destination']['country'] );
	}

	if ( function_exists( 'WC' ) && WC()->customer ) {
		$country = WC()->customer->get_shipping_country();
		if ( is_string( $country ) && $country !== '' ) {
			return strtoupper( $country );
		}
	}

	return '';
}

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
