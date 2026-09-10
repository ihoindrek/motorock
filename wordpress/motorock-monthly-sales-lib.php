<?php
/**
 * Monthly WooCommerce sales stats for traffic vs revenue reporting.
 */

defined( 'ABSPATH' ) || exit;

/**
 * @return string[]
 */
function motorock_monthly_sales_order_statuses(): array {
	return array( 'completed', 'processing' );
}

/**
 * @param string $from Y-m-d
 * @param string $to   Y-m-d
 * @return array<int, WC_Order>
 */
function motorock_monthly_sales_fetch_orders( string $from, string $to ): array {
	if ( ! function_exists( 'wc_get_orders' ) ) {
		return array();
	}

	$after  = strtotime( $from . ' 00:00:00 UTC' );
	$before = strtotime( $to . ' 23:59:59 UTC' );

	if ( ! $after || ! $before ) {
		return array();
	}

	$orders = wc_get_orders(
		array(
			'limit'        => -1,
			'status'       => motorock_monthly_sales_order_statuses(),
			'date_created' => $after . '...' . $before,
			'return'       => 'objects',
		)
	);

	return is_array( $orders ) ? $orders : array();
}

/**
 * @param string $from Y-m-d
 * @param string $to   Y-m-d
 * @return array{
 *   from: string,
 *   to: string,
 *   totals: array{orders: int, net_revenue: float, gross_revenue: float, items: int},
 *   months: list<array{
 *     month: string,
 *     orders: int,
 *     net_revenue: float,
 *     gross_revenue: float,
 *     items: int,
 *     avg_order_value: float
 *   }>
 * }
 */
function motorock_build_monthly_sales_report( string $from, string $to ): array {
	$orders = motorock_monthly_sales_fetch_orders( $from, $to );
	$months = array();

	foreach ( $orders as $order ) {
		if ( ! $order instanceof WC_Order ) {
			continue;
		}

		$created = $order->get_date_created();
		if ( ! $created ) {
			continue;
		}

		$month_key = $created->date( 'Y-m' );
		if ( ! isset( $months[ $month_key ] ) ) {
			$months[ $month_key ] = array(
				'month'          => $month_key,
				'orders'         => 0,
				'net_revenue'    => 0.0,
				'gross_revenue'  => 0.0,
				'items'          => 0,
				'avg_order_value' => 0.0,
			);
		}

		$months[ $month_key ]['orders']        += 1;
		$months[ $month_key ]['net_revenue']  += (float) $order->get_total() - (float) $order->get_total_tax();
		$months[ $month_key ]['gross_revenue'] += (float) $order->get_total();
		$months[ $month_key ]['items']        += (int) $order->get_item_count();
	}

	ksort( $months );

	$totals = array(
		'orders'        => 0,
		'net_revenue'   => 0.0,
		'gross_revenue' => 0.0,
		'items'         => 0,
	);

	foreach ( $months as &$row ) {
		$row['net_revenue']   = round( $row['net_revenue'], 2 );
		$row['gross_revenue'] = round( $row['gross_revenue'], 2 );
		$row['avg_order_value'] = $row['orders'] > 0
			? round( $row['net_revenue'] / $row['orders'], 2 )
			: 0.0;

		$totals['orders']        += $row['orders'];
		$totals['net_revenue']   += $row['net_revenue'];
		$totals['gross_revenue'] += $row['gross_revenue'];
		$totals['items']         += $row['items'];
	}
	unset( $row );

	$totals['net_revenue']   = round( $totals['net_revenue'], 2 );
	$totals['gross_revenue'] = round( $totals['gross_revenue'], 2 );

	return array(
		'from'   => $from,
		'to'     => $to,
		'totals' => $totals,
		'months' => array_values( $months ),
	);
}
