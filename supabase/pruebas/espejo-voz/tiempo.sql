-- tiempo.sql — cuánto tarda la puerta adentro de Postgres (30 vueltas, contra get_app_flag); sql.py probar lo deshace.

do $t$
declare
    t0 timestamptz; v jsonb; d_puerta numeric[] := '{}'; d_flag numeric[] := '{}'; d_aparta numeric[] := '{}';
begin
    for i in 1..30 loop
        t0 := clock_timestamp();
        perform get_app_flag('espejo_voz_plana');
        d_flag := d_flag || (extract(epoch from clock_timestamp() - t0) * 1000)::numeric(10,3);
        t0 := clock_timestamp();
        v := reservar_espejo_voz('sonda-tiempo', '', 1000000, 'margo/no-existe-sonda', 'espejo_voz_swap', 'espejo_voz_plana',
                                 6000, 600, 5000, 80, 18000, 86400, 2592000, 7776000);
        d_puerta := d_puerta || (extract(epoch from clock_timestamp() - t0) * 1000)::numeric(10,3);
        t0 := clock_timestamp();
        v := reservar_espejo_voz('sonda-tiempo', '', 1, 'margo/no-existe-sonda', 'espejo_voz_swap', 'espejo_voz_plana',
                                 6000, 600, 5000, 80, 18000, 86400, 2592000, 7776000);
        d_aparta := d_aparta || (extract(epoch from clock_timestamp() - t0) * 1000)::numeric(10,3);
    end loop;
    raise exception 'ms dentro de Postgres (30 vueltas) · get_app_flag: %  · puerta sin apartar: % · puerta que aparta (con el freno global): %',
        (select format('mín %s mediana %s máx %s', min(x), percentile_cont(0.5) within group (order by x), max(x)) from unnest(d_flag) x),
        (select format('mín %s mediana %s máx %s', min(x), percentile_cont(0.5) within group (order by x), max(x)) from unnest(d_puerta) x),
        (select format('mín %s mediana %s máx %s', min(x), percentile_cont(0.5) within group (order by x), max(x)) from unnest(d_aparta) x);
end $t$;
