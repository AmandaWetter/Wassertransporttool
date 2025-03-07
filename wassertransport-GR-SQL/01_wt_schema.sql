-- #####################################################################
-- # Leitung
-- #####################################################################
create table if not exists feuerwehr.wt_leitung
(
    ltg_id               serial primary key,
    wtp_id               integer,
    leitun_nr            integer,
    laenge               double precision,
    h2o_menge            integer,
    schlauchleitung_id   text
        references feuerwehr.wt_schlauchleitung (text_id),
    schlauchleitung_text text,
    dhoehe               double precision,
    e_bar                double precision,
    a_bar                double precision,
    wkb_geometry         geometry(LineString, 2056),
    max_laenge           integer   default 5000,
    ersteller            text      default 'gisz'::text not null,
    datum                timestamp default now()
);

create index if not exists wt_leitung_geometry
    on feuerwehr.wt_leitung using gist (wkb_geometry);

create index if not exists wt_leitung_wtp_id
    on feuerwehr.wt_leitung (wtp_id);


-- #####################################################################
-- # Pumpe
-- #####################################################################
create table if not exists feuerwehr.wt_pumpe
(
    pmp_id       serial primary key,
    wtp_id       integer,
    pumpe_nr     integer,
    typ          integer,
    e_bar        double precision,
    a_bar        double precision,
    alt          double precision,
    becken_ms    integer,
    wkb_geometry geometry(Point, 2056)
);

create index if not exists wt_pumpe_geometry
    on feuerwehr.wt_pumpe using gist (wkb_geometry);


-- #####################################################################
-- # Druckverlust
-- #####################################################################
create table if not exists feuerwehr.wt_druckverlust
(
    id          serial primary key,
    wassermenge integer,
    sch_55      numeric,
    sch_2_55    numeric,
    sch_75      numeric,
    sch_2_75    numeric,
    sch_110     numeric,
    sch_2_110   numeric
);

comment on column feuerwehr.wt_druckverlust.wassermenge is 'Q l/m';
comment on column feuerwehr.wt_druckverlust.sch_55 is 'Schlauchart in mm (55)';
comment on column feuerwehr.wt_druckverlust.sch_2_55 is 'Schlauchart in mm (2 * 55)';
comment on column feuerwehr.wt_druckverlust.sch_75 is 'Schlauchart in mm (75)';
comment on column feuerwehr.wt_druckverlust.sch_2_75 is 'Schlauchart in mm (2 * 75)';
comment on column feuerwehr.wt_druckverlust.sch_110 is 'Schlauchart in mm (110)';
comment on column feuerwehr.wt_druckverlust.sch_2_110 is 'Schlauchart in mm (2 * 110)';

alter table feuerwehr.wt_druckverlust
    owner to fme;


-- #####################################################################
-- # Schlauchleitung
-- #####################################################################
create table if not exists feuerwehr.wt_schlauchleitung
(
    id      serial primary key,
    text_id text not null
        constraint wt_schlauchleitung_text_id unique,
    label   text not null
);

comment on column feuerwehr.wt_schlauchleitung.text_id is 'Should correspond to column names in feuerwehr.wt_druckverlust table.';

-- #####################################################################
-- # Leitung (Temporäre Daten nach Berechnung)
-- #####################################################################
create table webservice_map.wt_leitung
(
    ltg_id               serial primary key,
    wtp_id               integer,
    leitun_nr            integer,
    laenge               double precision,
    h2o_menge            integer,
    schlauchleitung_id   text
        references feuerwehr.wt_schlauchleitung (text_id),
    schlauchleitung_text text,
    dhoehe               double precision,
    e_bar                double precision,
    a_bar                double precision,
    wkb_geometry         geometry(LineString, 2056),
    max_laenge           integer   default 5000,
    ersteller            text,
    datum                timestamp default now()
);


-- #####################################################################
-- # Pumpe (Temporäre Daten nach Berechnung)
-- #####################################################################
create table webservice_map.wt_pumpe
(
    pmp_id       serial primary key,
    wtp_id       integer,
    pumpe_nr     integer,
    typ          integer,
    e_bar        double precision,
    a_bar        double precision,
    alt          double precision,
    becken_ms    integer,
    wkb_geometry geometry(Point, 2056)
);


-- #####################################################################
-- # Berechtigungen (Alle Tabellen)
-- #####################################################################
grant select on feuerwehr.wt_leitung to feuerwehr_v;
grant select on feuerwehr.wt_pumpe to feuerwehr_v;
grant select on feuerwehr.wt_druckverlust to feuerwehr_v;
grant select on feuerwehr.wt_schlauchleitung to feuerwehr_v;

grant delete, insert, select, update on feuerwehr.wt_leitung to feuerwehr_e;
grant delete, insert, select, update on feuerwehr.wt_pumpe to feuerwehr_e;
grant delete, insert, select, update on feuerwehr.wt_druckverlust to feuerwehr_e;
grant delete, insert, select, update on feuerwehr.wt_schlauchleitung to feuerwehr_e;