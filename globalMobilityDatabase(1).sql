--
-- PostgreSQL database dump
--

\restrict zlfKV7ln9vtAimASTqEzEmIrtCKxI13Uwa4opMSZ0P53BOezy1O3U6ehoUVoNT3

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-03-26 23:12:45

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE globalmobility;
--
-- TOC entry 5103 (class 1262 OID 16392)
-- Name: globalmobility; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE globalmobility WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United Arab Emirates.1252';


ALTER DATABASE globalmobility OWNER TO postgres;

\unrestrict zlfKV7ln9vtAimASTqEzEmIrtCKxI13Uwa4opMSZ0P53BOezy1O3U6ehoUVoNT3
\connect globalmobility
\restrict zlfKV7ln9vtAimASTqEzEmIrtCKxI13Uwa4opMSZ0P53BOezy1O3U6ehoUVoNT3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 16568)
-- Name: bottleneck_report; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bottleneck_report (
    report_id integer NOT NULL,
    segment_id integer,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    severity_score numeric(5,2) NOT NULL
);


ALTER TABLE public.bottleneck_report OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16417)
-- Name: carrier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carrier (
    carrier_id integer NOT NULL,
    name character varying(100) NOT NULL,
    carrier_type character varying(10) NOT NULL,
    country_code character(2) NOT NULL,
    CONSTRAINT carrier_carrier_type_check CHECK (((carrier_type)::text = ANY ((ARRAY['AIR'::character varying, 'RAIL'::character varying, 'SEA'::character varying])::text[])))
);


ALTER TABLE public.carrier OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16529)
-- Name: congestion_record; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.congestion_record (
    congestion_id integer NOT NULL,
    segment_id integer,
    "timestamp" timestamp without time zone NOT NULL,
    congestion_level integer NOT NULL,
    avg_speed numeric(6,2) NOT NULL,
    vehicle_count integer NOT NULL,
    CONSTRAINT congestion_record_avg_speed_check CHECK ((avg_speed >= (0)::numeric)),
    CONSTRAINT congestion_record_congestion_level_check CHECK (((congestion_level >= 0) AND (congestion_level <= 100))),
    CONSTRAINT congestion_record_vehicle_count_check CHECK ((vehicle_count >= 0))
);


ALTER TABLE public.congestion_record OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16547)
-- Name: delay_event; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delay_event (
    delay_id integer NOT NULL,
    trip_id integer,
    node_id integer,
    delay_minutes integer NOT NULL,
    delay_reason character varying(20) NOT NULL,
    event_time timestamp without time zone NOT NULL,
    CONSTRAINT delay_event_delay_minutes_check CHECK ((delay_minutes >= 0)),
    CONSTRAINT delay_event_delay_reason_check CHECK (((delay_reason)::text = ANY ((ARRAY['WEATHER'::character varying, 'TRAFFIC'::character varying, 'MAINTENANCE'::character varying, 'CONTROL'::character varying, 'UNKNOWN'::character varying])::text[])))
);


ALTER TABLE public.delay_event OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16427)
-- Name: location_node; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location_node (
    node_id integer NOT NULL,
    node_type character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    country character varying(50) NOT NULL,
    latitude numeric(9,6) NOT NULL,
    longitude numeric(9,6) NOT NULL,
    CONSTRAINT location_node_latitude_check CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT location_node_longitude_check CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric))),
    CONSTRAINT location_node_node_type_check CHECK (((node_type)::text = ANY ((ARRAY['AIRPORT'::character varying, 'PORT'::character varying, 'STATION'::character varying])::text[])))
);


ALTER TABLE public.location_node OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16511)
-- Name: position_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.position_log (
    pos_id integer NOT NULL,
    trip_id integer,
    "timestamp" timestamp without time zone NOT NULL,
    latitude numeric(9,6) NOT NULL,
    longitude numeric(9,6) NOT NULL,
    altitude numeric(8,2),
    speed numeric(6,2) NOT NULL,
    CONSTRAINT position_log_latitude_check CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT position_log_longitude_check CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric))),
    CONSTRAINT position_log_speed_check CHECK ((speed >= (0)::numeric))
);


ALTER TABLE public.position_log OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16471)
-- Name: route; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.route (
    route_id integer NOT NULL,
    route_type character varying(10) NOT NULL,
    origin_node_id integer,
    destination_node_id integer,
    distance_km numeric(10,2) NOT NULL,
    segment_id integer,
    CONSTRAINT route_distance_km_check CHECK ((distance_km > (0)::numeric)),
    CONSTRAINT route_route_type_check CHECK (((route_type)::text = ANY ((ARRAY['AIR'::character varying, 'RAIL'::character varying, 'SEA'::character varying, 'ROAD'::character varying])::text[])))
);


ALTER TABLE public.route OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16441)
-- Name: traffic_segment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.traffic_segment (
    segment_id integer NOT NULL,
    segment_name character varying(100) NOT NULL,
    segment_type character varying(10) NOT NULL,
    geometry text NOT NULL,
    region character varying(50) NOT NULL,
    CONSTRAINT traffic_segment_segment_type_check CHECK (((segment_type)::text = ANY ((ARRAY['ROAD'::character varying, 'SEA_LANE'::character varying])::text[])))
);


ALTER TABLE public.traffic_segment OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16491)
-- Name: trip; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trip (
    trip_id integer NOT NULL,
    vehicle_id integer,
    route_id integer,
    scheduled_departure timestamp without time zone NOT NULL,
    scheduled_arrival timestamp without time zone NOT NULL,
    actual_departure timestamp without time zone,
    actual_arrival timestamp without time zone,
    trip_status character varying(10) NOT NULL,
    CONSTRAINT trip_trip_status_check CHECK (((trip_status)::text = ANY ((ARRAY['ON_TIME'::character varying, 'DELAYED'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.trip OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16454)
-- Name: vehicle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle (
    vehicle_id integer NOT NULL,
    carrier_id integer,
    vehicle_type character varying(10) NOT NULL,
    reg_number character varying(50) NOT NULL,
    model_name character varying(100) NOT NULL,
    CONSTRAINT vehicle_vehicle_type_check CHECK (((vehicle_type)::text = ANY ((ARRAY['AIRCRAFT'::character varying, 'TRAIN'::character varying, 'SHIP'::character varying])::text[])))
);


ALTER TABLE public.vehicle OWNER TO postgres;

--
-- TOC entry 5097 (class 0 OID 16568)
-- Dependencies: 228
-- Data for Name: bottleneck_report; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.bottleneck_report VALUES (1, 1, '2026-03-11 08:00:00', '2026-03-11 10:00:00', 85.50);
INSERT INTO public.bottleneck_report VALUES (2, 2, '2026-03-07 11:00:00', '2026-03-07 14:00:00', 60.00);
INSERT INTO public.bottleneck_report VALUES (3, 3, '2026-03-13 08:30:00', '2026-03-13 11:30:00', 72.30);
INSERT INTO public.bottleneck_report VALUES (4, 4, '2026-03-10 13:00:00', '2026-03-10 16:00:00', 55.00);
INSERT INTO public.bottleneck_report VALUES (5, 5, '2026-03-15 08:00:00', '2026-03-15 12:00:00', 68.20);
INSERT INTO public.bottleneck_report VALUES (6, 6, '2026-03-18 13:00:00', '2026-03-18 18:00:00', 52.40);


--
-- TOC entry 5088 (class 0 OID 16417)
-- Dependencies: 219
-- Data for Name: carrier; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.carrier VALUES (1, 'Air India', 'AIR', 'IN');
INSERT INTO public.carrier VALUES (2, 'Indian Railways', 'RAIL', 'IN');
INSERT INTO public.carrier VALUES (3, 'Maersk Line', 'SEA', 'DK');
INSERT INTO public.carrier VALUES (4, 'Emirates', 'AIR', 'AE');
INSERT INTO public.carrier VALUES (5, 'Union Pacific Rail', 'RAIL', 'US');
INSERT INTO public.carrier VALUES (6, 'Lufthansa', 'AIR', 'DE');
INSERT INTO public.carrier VALUES (7, 'Japan Railways', 'RAIL', 'JP');
INSERT INTO public.carrier VALUES (8, 'MSC Shipping', 'SEA', 'CH');


--
-- TOC entry 5095 (class 0 OID 16529)
-- Dependencies: 226
-- Data for Name: congestion_record; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.congestion_record VALUES (1, 1, '2026-03-11 08:00:00', 70, 45.50, 120);
INSERT INTO public.congestion_record VALUES (2, 1, '2026-03-11 09:00:00', 85, 30.20, 200);
INSERT INTO public.congestion_record VALUES (3, 2, '2026-03-07 12:00:00', 40, 25.00, 50);
INSERT INTO public.congestion_record VALUES (4, 3, '2026-03-13 09:00:00', 60, 50.50, 110);
INSERT INTO public.congestion_record VALUES (5, 3, '2026-03-13 10:00:00', 75, 35.00, 180);
INSERT INTO public.congestion_record VALUES (6, 4, '2026-03-10 14:00:00', 45, 28.50, 60);
INSERT INTO public.congestion_record VALUES (7, 5, '2026-03-15 09:00:00', 50, 60.50, 100);
INSERT INTO public.congestion_record VALUES (8, 5, '2026-03-15 10:00:00', 65, 45.20, 150);
INSERT INTO public.congestion_record VALUES (9, 6, '2026-03-18 14:00:00', 30, 22.50, 70);


--
-- TOC entry 5096 (class 0 OID 16547)
-- Dependencies: 227
-- Data for Name: delay_event; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.delay_event VALUES (1, 1, 1, 10, 'WEATHER', '2026-03-10 08:05:00');
INSERT INTO public.delay_event VALUES (2, 1, 2, 20, 'TRAFFIC', '2026-03-10 10:50:00');
INSERT INTO public.delay_event VALUES (3, 3, 3, 30, 'MAINTENANCE', '2026-03-06 09:00:00');
INSERT INTO public.delay_event VALUES (4, 5, 7, 15, 'WEATHER', '2026-03-12 11:10:00');
INSERT INTO public.delay_event VALUES (5, 7, 3, 40, 'TRAFFIC', '2026-03-09 09:30:00');
INSERT INTO public.delay_event VALUES (6, 6, 10, 5, 'CONTROL', '2026-03-13 07:10:00');
INSERT INTO public.delay_event VALUES (7, 8, 11, 25, 'WEATHER', '2026-03-15 06:20:00');
INSERT INTO public.delay_event VALUES (8, 11, 13, 45, 'TRAFFIC', '2026-03-14 10:00:00');
INSERT INTO public.delay_event VALUES (9, 9, 12, 5, 'CONTROL', '2026-03-16 09:05:00');


--
-- TOC entry 5089 (class 0 OID 16427)
-- Dependencies: 220
-- Data for Name: location_node; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.location_node VALUES (1, 'AIRPORT', 'Chennai International Airport', 'India', 12.994100, 80.170900);
INSERT INTO public.location_node VALUES (2, 'AIRPORT', 'Delhi International Airport', 'India', 28.556200, 77.100000);
INSERT INTO public.location_node VALUES (3, 'PORT', 'Chennai Port', 'India', 13.082700, 80.270700);
INSERT INTO public.location_node VALUES (4, 'PORT', 'Singapore Port', 'Singapore', 1.264400, 103.822300);
INSERT INTO public.location_node VALUES (5, 'STATION', 'Chennai Central', 'India', 13.082700, 80.275000);
INSERT INTO public.location_node VALUES (6, 'STATION', 'Bangalore City Station', 'India', 12.978400, 77.571300);
INSERT INTO public.location_node VALUES (7, 'AIRPORT', 'Dubai International Airport', 'UAE', 25.253200, 55.365700);
INSERT INTO public.location_node VALUES (8, 'AIRPORT', 'Bangalore International Airport', 'India', 13.198600, 77.706600);
INSERT INTO public.location_node VALUES (9, 'PORT', 'Dubai Port', 'UAE', 25.065700, 55.171300);
INSERT INTO public.location_node VALUES (10, 'STATION', 'Hyderabad Station', 'India', 17.385000, 78.486700);
INSERT INTO public.location_node VALUES (11, 'AIRPORT', 'Frankfurt Airport', 'Germany', 50.037900, 8.562200);
INSERT INTO public.location_node VALUES (12, 'AIRPORT', 'Tokyo Haneda Airport', 'Japan', 35.549400, 139.779800);
INSERT INTO public.location_node VALUES (13, 'PORT', 'Hamburg Port', 'Germany', 53.546100, 9.966100);
INSERT INTO public.location_node VALUES (14, 'PORT', 'Tokyo Port', 'Japan', 35.616700, 139.766700);
INSERT INTO public.location_node VALUES (15, 'STATION', 'Tokyo Central Station', 'Japan', 35.681200, 139.767100);


--
-- TOC entry 5094 (class 0 OID 16511)
-- Dependencies: 225
-- Data for Name: position_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.position_log VALUES (1, 1, '2026-03-10 08:30:00', 13.500000, 80.500000, 30000.00, 850.00);
INSERT INTO public.position_log VALUES (2, 1, '2026-03-10 09:30:00', 18.000000, 78.000000, 32000.00, 870.00);
INSERT INTO public.position_log VALUES (3, 2, '2026-03-11 07:30:00', 13.000000, 79.500000, NULL, 90.00);
INSERT INTO public.position_log VALUES (4, 3, '2026-03-06 10:00:00', 10.000000, 85.000000, NULL, 40.00);
INSERT INTO public.position_log VALUES (5, 4, '2026-03-12 06:00:00', 20.000000, 70.000000, 31000.00, 860.00);
INSERT INTO public.position_log VALUES (6, 4, '2026-03-12 07:30:00', 15.000000, 75.000000, 33000.00, 880.00);
INSERT INTO public.position_log VALUES (7, 5, '2026-03-12 12:30:00', 16.000000, 78.000000, 30000.00, 820.00);
INSERT INTO public.position_log VALUES (8, 6, '2026-03-13 08:30:00', 16.500000, 79.000000, NULL, 95.00);
INSERT INTO public.position_log VALUES (9, 7, '2026-03-09 10:00:00', 14.000000, 85.000000, NULL, 38.00);
INSERT INTO public.position_log VALUES (10, 8, '2026-03-15 08:00:00', 45.000000, 20.000000, 32000.00, 870.00);
INSERT INTO public.position_log VALUES (11, 8, '2026-03-15 12:00:00', 50.000000, 40.000000, 33000.00, 880.00);
INSERT INTO public.position_log VALUES (12, 9, '2026-03-16 13:00:00', 48.000000, 35.000000, 30000.00, 850.00);
INSERT INTO public.position_log VALUES (13, 10, '2026-03-17 09:00:00', 34.000000, 135.000000, NULL, 120.00);
INSERT INTO public.position_log VALUES (14, 11, '2026-03-14 11:00:00', 30.000000, 120.000000, NULL, 42.00);


--
-- TOC entry 5092 (class 0 OID 16471)
-- Dependencies: 223
-- Data for Name: route; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.route VALUES (4, 'AIR', 7, 1, 2950.00, NULL);
INSERT INTO public.route VALUES (1, 'AIR', 1, 2, 2200.00, 1);
INSERT INTO public.route VALUES (2, 'RAIL', 5, 6, 350.00, 1);
INSERT INTO public.route VALUES (3, 'SEA', 3, 4, 3100.00, 2);
INSERT INTO public.route VALUES (7, 'SEA', 9, 3, 2500.00, 2);
INSERT INTO public.route VALUES (6, 'RAIL', 10, 6, 500.00, 3);
INSERT INTO public.route VALUES (10, 'RAIL', 15, 10, 800.00, 3);
INSERT INTO public.route VALUES (5, 'AIR', 8, 2, 2150.00, 4);
INSERT INTO public.route VALUES (8, 'AIR', 11, 12, 9300.00, 5);
INSERT INTO public.route VALUES (9, 'SEA', 13, 14, 9500.00, 6);
INSERT INTO public.route VALUES (11, 'ROAD', 5, 6, 420.00, 3);
INSERT INTO public.route VALUES (12, 'AIR', 7, 2, 2100.00, 4);
INSERT INTO public.route VALUES (13, 'SEA', 13, 3, 2700.00, 2);


--
-- TOC entry 5090 (class 0 OID 16441)
-- Dependencies: 221
-- Data for Name: traffic_segment; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.traffic_segment VALUES (1, 'Chennai-Bangalore Highway', 'ROAD', 'LINESTRING(80.2707 13.0827,77.5946 12.9716)', 'South India');
INSERT INTO public.traffic_segment VALUES (2, 'Indian Ocean Shipping Lane', 'SEA_LANE', 'LINESTRING(80.2707 13.0827,103.8223 1.2644)', 'Indian Ocean');
INSERT INTO public.traffic_segment VALUES (3, 'Bangalore-Hyderabad Highway', 'ROAD', 'LINESTRING(77.5946 12.9716,78.4867 17.3850)', 'South India');
INSERT INTO public.traffic_segment VALUES (4, 'Arabian Sea Shipping Lane', 'SEA_LANE', 'LINESTRING(55.1713 25.0657,80.2707 13.0827)', 'Arabian Sea');
INSERT INTO public.traffic_segment VALUES (5, 'Frankfurt-Airport Highway', 'ROAD', 'LINESTRING(8.5622 50.0379,9.1829 48.7758)', 'Germany');
INSERT INTO public.traffic_segment VALUES (6, 'Pacific Shipping Lane', 'SEA_LANE', 'LINESTRING(139.7667 35.6167,103.8223 1.2644)', 'Pacific Ocean');


--
-- TOC entry 5093 (class 0 OID 16491)
-- Dependencies: 224
-- Data for Name: trip; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.trip VALUES (1, 1, 1, '2026-03-10 08:00:00', '2026-03-10 11:00:00', '2026-03-10 08:10:00', '2026-03-10 11:20:00', 'DELAYED');
INSERT INTO public.trip VALUES (2, 2, 2, '2026-03-11 06:00:00', '2026-03-11 11:00:00', '2026-03-11 06:00:00', '2026-03-11 10:55:00', 'ON_TIME');
INSERT INTO public.trip VALUES (3, 3, 3, '2026-03-05 14:00:00', '2026-03-15 16:00:00', '2026-03-05 14:30:00', NULL, 'DELAYED');
INSERT INTO public.trip VALUES (4, 4, 4, '2026-03-12 05:00:00', '2026-03-12 09:00:00', '2026-03-12 05:05:00', '2026-03-12 08:55:00', 'ON_TIME');
INSERT INTO public.trip VALUES (5, 5, 5, '2026-03-12 11:00:00', '2026-03-12 14:00:00', '2026-03-12 11:20:00', NULL, 'DELAYED');
INSERT INTO public.trip VALUES (6, 6, 6, '2026-03-13 07:00:00', '2026-03-13 12:00:00', '2026-03-13 07:00:00', NULL, 'ON_TIME');
INSERT INTO public.trip VALUES (7, 3, 7, '2026-03-08 10:00:00', '2026-03-18 18:00:00', '2026-03-08 10:30:00', NULL, 'DELAYED');
INSERT INTO public.trip VALUES (8, 7, 8, '2026-03-15 06:00:00', '2026-03-15 18:00:00', '2026-03-15 06:10:00', NULL, 'DELAYED');
INSERT INTO public.trip VALUES (9, 8, 8, '2026-03-16 09:00:00', '2026-03-16 20:00:00', '2026-03-16 09:00:00', '2026-03-16 19:45:00', 'ON_TIME');
INSERT INTO public.trip VALUES (10, 9, 10, '2026-03-17 07:00:00', '2026-03-17 12:00:00', '2026-03-17 07:05:00', NULL, 'ON_TIME');
INSERT INTO public.trip VALUES (11, 10, 9, '2026-03-12 14:00:00', '2026-03-22 10:00:00', '2026-03-12 14:20:00', NULL, 'DELAYED');


--
-- TOC entry 5091 (class 0 OID 16454)
-- Dependencies: 222
-- Data for Name: vehicle; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.vehicle VALUES (1, 1, 'AIRCRAFT', 'VT-AIA', 'Boeing 787');
INSERT INTO public.vehicle VALUES (2, 2, 'TRAIN', 'IR-2201', 'Shatabdi Express');
INSERT INTO public.vehicle VALUES (3, 3, 'SHIP', 'MSK-8891', 'Maersk Container Vessel');
INSERT INTO public.vehicle VALUES (4, 4, 'AIRCRAFT', 'A6-EM1', 'Airbus A380');
INSERT INTO public.vehicle VALUES (5, 4, 'AIRCRAFT', 'A6-EM2', 'Boeing 777');
INSERT INTO public.vehicle VALUES (6, 5, 'TRAIN', 'UP-7711', 'Union Pacific Express');
INSERT INTO public.vehicle VALUES (7, 6, 'AIRCRAFT', 'LH-900', 'Airbus A320');
INSERT INTO public.vehicle VALUES (8, 6, 'AIRCRAFT', 'LH-901', 'Airbus A350');
INSERT INTO public.vehicle VALUES (9, 7, 'TRAIN', 'JR-550', 'Shinkansen Bullet Train');
INSERT INTO public.vehicle VALUES (10, 8, 'SHIP', 'MSC-321', 'MSC Cargo Vessel');


--
-- TOC entry 4929 (class 2606 OID 16576)
-- Name: bottleneck_report bottleneck_report_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bottleneck_report
    ADD CONSTRAINT bottleneck_report_pkey PRIMARY KEY (report_id);


--
-- TOC entry 4909 (class 2606 OID 16426)
-- Name: carrier carrier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrier
    ADD CONSTRAINT carrier_pkey PRIMARY KEY (carrier_id);


--
-- TOC entry 4925 (class 2606 OID 16541)
-- Name: congestion_record congestion_record_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.congestion_record
    ADD CONSTRAINT congestion_record_pkey PRIMARY KEY (congestion_id);


--
-- TOC entry 4927 (class 2606 OID 16557)
-- Name: delay_event delay_event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delay_event
    ADD CONSTRAINT delay_event_pkey PRIMARY KEY (delay_id);


--
-- TOC entry 4911 (class 2606 OID 16440)
-- Name: location_node location_node_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_node
    ADD CONSTRAINT location_node_pkey PRIMARY KEY (node_id);


--
-- TOC entry 4923 (class 2606 OID 16523)
-- Name: position_log position_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_log
    ADD CONSTRAINT position_log_pkey PRIMARY KEY (pos_id);


--
-- TOC entry 4919 (class 2606 OID 16480)
-- Name: route route_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.route
    ADD CONSTRAINT route_pkey PRIMARY KEY (route_id);


--
-- TOC entry 4913 (class 2606 OID 16453)
-- Name: traffic_segment traffic_segment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traffic_segment
    ADD CONSTRAINT traffic_segment_pkey PRIMARY KEY (segment_id);


--
-- TOC entry 4921 (class 2606 OID 16500)
-- Name: trip trip_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT trip_pkey PRIMARY KEY (trip_id);


--
-- TOC entry 4915 (class 2606 OID 16463)
-- Name: vehicle vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_pkey PRIMARY KEY (vehicle_id);


--
-- TOC entry 4917 (class 2606 OID 16465)
-- Name: vehicle vehicle_reg_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_reg_number_key UNIQUE (reg_number);


--
-- TOC entry 4940 (class 2606 OID 16577)
-- Name: bottleneck_report bottleneck_report_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bottleneck_report
    ADD CONSTRAINT bottleneck_report_segment_id_fkey FOREIGN KEY (segment_id) REFERENCES public.traffic_segment(segment_id);


--
-- TOC entry 4937 (class 2606 OID 16542)
-- Name: congestion_record congestion_record_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.congestion_record
    ADD CONSTRAINT congestion_record_segment_id_fkey FOREIGN KEY (segment_id) REFERENCES public.traffic_segment(segment_id);


--
-- TOC entry 4938 (class 2606 OID 16563)
-- Name: delay_event delay_event_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delay_event
    ADD CONSTRAINT delay_event_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.location_node(node_id);


--
-- TOC entry 4939 (class 2606 OID 16558)
-- Name: delay_event delay_event_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delay_event
    ADD CONSTRAINT delay_event_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trip(trip_id);


--
-- TOC entry 4931 (class 2606 OID 16582)
-- Name: route fk_route_segment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.route
    ADD CONSTRAINT fk_route_segment FOREIGN KEY (segment_id) REFERENCES public.traffic_segment(segment_id);


--
-- TOC entry 4936 (class 2606 OID 16524)
-- Name: position_log position_log_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_log
    ADD CONSTRAINT position_log_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trip(trip_id);


--
-- TOC entry 4932 (class 2606 OID 16486)
-- Name: route route_destination_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.route
    ADD CONSTRAINT route_destination_node_id_fkey FOREIGN KEY (destination_node_id) REFERENCES public.location_node(node_id);


--
-- TOC entry 4933 (class 2606 OID 16481)
-- Name: route route_origin_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.route
    ADD CONSTRAINT route_origin_node_id_fkey FOREIGN KEY (origin_node_id) REFERENCES public.location_node(node_id);


--
-- TOC entry 4934 (class 2606 OID 16506)
-- Name: trip trip_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT trip_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.route(route_id);


--
-- TOC entry 4935 (class 2606 OID 16501)
-- Name: trip trip_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT trip_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(vehicle_id);


--
-- TOC entry 4930 (class 2606 OID 16466)
-- Name: vehicle vehicle_carrier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carrier(carrier_id);


-- Completed on 2026-03-26 23:12:45

--
-- PostgreSQL database dump complete
--

\unrestrict zlfKV7ln9vtAimASTqEzEmIrtCKxI13Uwa4opMSZ0P53BOezy1O3U6ehoUVoNT3

