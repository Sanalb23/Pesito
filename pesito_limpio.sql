--
-- PostgreSQL database dump
--

\restrict CoZal2JeiQn7j4O3g5SvlI8Hof2mHTIBYKvb6vVari3aSeCmcNrg7rZooQU0YRO

-- Dumped from database version 18.6 (fd34222)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-1.pgdg24.04+2)

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

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: friend_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.friend_status AS ENUM (
    'Active',
    'Pending'
);


ALTER TYPE public.friend_status OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: games; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.games (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    release_year smallint NOT NULL
);


ALTER TABLE public.games OWNER TO neondb_owner;

--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.games_id_seq OWNER TO neondb_owner;

--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- Name: leagues; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.leagues (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    base_league_id integer
);


ALTER TABLE public.leagues OWNER TO neondb_owner;

--
-- Name: leagues_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.leagues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leagues_id_seq OWNER TO neondb_owner;

--
-- Name: leagues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.leagues_id_seq OWNED BY public.leagues.id;


--
-- Name: match_stats; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.match_stats (
    id integer NOT NULL,
    match_id integer NOT NULL,
    home_possession numeric(5,2),
    away_possession numeric(5,2),
    home_shots integer,
    away_shots integer,
    home_penalties integer,
    away_penalties integer,
    home_free_kicks integer,
    away_free_kicks integer,
    home_corner_kicks integer,
    away_corner_kicks integer,
    home_offsides integer,
    away_offsides integer,
    home_fouls integer,
    away_fouls integer,
    home_yellow_cards integer,
    away_yellow_cards integer,
    home_red_cards integer,
    away_red_cards integer,
    home_shots_on_target integer,
    away_shots_on_target integer
);


ALTER TABLE public.match_stats OWNER TO neondb_owner;

--
-- Name: match_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.match_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_stats_id_seq OWNER TO neondb_owner;

--
-- Name: match_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.match_stats_id_seq OWNED BY public.match_stats.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    home_user_id integer,
    away_user_id integer,
    home_team_game_id integer NOT NULL,
    away_team_game_id integer NOT NULL,
    home_goals integer DEFAULT 0 NOT NULL,
    away_goals integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT false,
    CONSTRAINT chk_matches_different_users CHECK (((home_user_id IS NULL) OR (away_user_id IS NULL) OR (home_user_id <> away_user_id)))
);


ALTER TABLE public.matches OWNER TO neondb_owner;

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matches_id_seq OWNER TO neondb_owner;

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    receiver_id integer CONSTRAINT notifications_reciever_id_not_null NOT NULL,
    type character varying(25) NOT NULL,
    content character varying,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sender_id integer,
    match_id integer,
    friendship_id integer,
    CONSTRAINT chk_ids_distinct CHECK ((sender_id <> receiver_id)),
    CONSTRAINT chk_notification_type_ids CHECK (((((type)::text = ANY ((ARRAY['match_confirmation'::character varying, 'match_request'::character varying, 'match_edit_request'::character varying, 'match_edit_confirmation'::character varying, 'match_delete_request'::character varying])::text[])) AND (match_id IS NOT NULL) AND (friendship_id IS NULL)) OR (((type)::text = ANY ((ARRAY['friend_request'::character varying, 'friend_confirmation'::character varying])::text[])) AND (friendship_id IS NOT NULL) AND (match_id IS NULL)) OR (((type)::text = 'match_delete_confirmation'::text) AND (match_id IS NULL) AND (friendship_id IS NULL)))),
    CONSTRAINT chk_notifications_type CHECK (((type)::text = ANY ((ARRAY['friend_request'::character varying, 'friend_confirmation'::character varying, 'match_request'::character varying, 'match_confirmation'::character varying, 'match_edit_request'::character varying, 'match_edit_confirmation'::character varying, 'match_delete_request'::character varying, 'match_delete_confirmation'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: players; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.players (
    id integer NOT NULL,
    base_player_id integer,
    name character varying(100) NOT NULL
);


ALTER TABLE public.players OWNER TO neondb_owner;

--
-- Name: players_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.players_id_seq OWNER TO neondb_owner;

--
-- Name: players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.players_id_seq OWNED BY public.players.id;


--
-- Name: regions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.regions (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.regions OWNER TO neondb_owner;

--
-- Name: regions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.regions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.regions_id_seq OWNER TO neondb_owner;

--
-- Name: regions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.regions_id_seq OWNED BY public.regions.id;


--
-- Name: teams; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    base_team_id integer,
    name character varying(100) NOT NULL
);


ALTER TABLE public.teams OWNER TO neondb_owner;

--
-- Name: teams_games; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.teams_games (
    id integer NOT NULL,
    team_id integer NOT NULL,
    game_id integer NOT NULL,
    league_id integer,
    region_id integer,
    logo_path character varying(255)
);


ALTER TABLE public.teams_games OWNER TO neondb_owner;

--
-- Name: teams_games_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.teams_games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_games_id_seq OWNER TO neondb_owner;

--
-- Name: teams_games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.teams_games_id_seq OWNED BY public.teams_games.id;


--
-- Name: teams_games_players; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.teams_games_players (
    id integer NOT NULL,
    team_game_id integer NOT NULL,
    player_id integer NOT NULL
);


ALTER TABLE public.teams_games_players OWNER TO neondb_owner;

--
-- Name: teams_games_players_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.teams_games_players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_games_players_id_seq OWNER TO neondb_owner;

--
-- Name: teams_games_players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.teams_games_players_id_seq OWNED BY public.teams_games_players.id;


--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_id_seq OWNER TO neondb_owner;

--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: user_friends; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_friends (
    user_id integer NOT NULL,
    friend_id integer NOT NULL,
    status public.friend_status DEFAULT 'Pending'::public.friend_status NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id integer NOT NULL,
    CONSTRAINT chk_ids_distinct CHECK ((user_id <> friend_id))
);


ALTER TABLE public.user_friends OWNER TO neondb_owner;

--
-- Name: user_friends_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_friends_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_friends_id_seq OWNER TO neondb_owner;

--
-- Name: user_friends_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_friends_id_seq OWNED BY public.user_friends.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    nickname character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255),
    auth_id character varying(255),
    auth_provider character varying(20) DEFAULT 'local'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verified boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: games id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- Name: leagues id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leagues ALTER COLUMN id SET DEFAULT nextval('public.leagues_id_seq'::regclass);


--
-- Name: match_stats id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.match_stats ALTER COLUMN id SET DEFAULT nextval('public.match_stats_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: players id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.players ALTER COLUMN id SET DEFAULT nextval('public.players_id_seq'::regclass);


--
-- Name: regions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.regions ALTER COLUMN id SET DEFAULT nextval('public.regions_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: teams_games id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games ALTER COLUMN id SET DEFAULT nextval('public.teams_games_id_seq'::regclass);


--
-- Name: teams_games_players id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games_players ALTER COLUMN id SET DEFAULT nextval('public.teams_games_players_id_seq'::regclass);


--
-- Name: user_friends id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_friends ALTER COLUMN id SET DEFAULT nextval('public.user_friends_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.games (id, name, release_year) FROM stdin;
1	PES 5	2005
16	PES 2008	2008
\.


--
-- Data for Name: leagues; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.leagues (id, name, base_league_id) FROM stdin;
1	Eredivisie	\N
2	Serie A	\N
3	Copa Libertadores	\N
4	Ligue 1	\N
5	LaLiga	\N
6	AFC Champions League	\N
7	Primera División de Argentina	\N
8	Primera División de Chile	\N
9	Copa Sudamericana	\N
10	Segunda División de España	\N
11	Ligue 2	\N
12	Campeonato Brasileiro Série A	\N
13	Süper Lig	\N
14	J1 League	\N
15	Primeira Liga	\N
16	Liga Premier de Rusia	\N
17	Thai League	\N
18	Categoría Primera A	\N
19	Primera División de Bélgica	\N
20	Scottish Premiership	\N
21	J2 League	\N
22	Superliga de China	\N
23	Superliga de Suiza	\N
24	Superliga de Dinamarca	\N
25	Campeonato Brasileiro Série B	\N
26	Serie B	\N
27	Premier League	\N
28	Bundesliga	\N
29	Liga MX	\N
30	EFL Championship	\N
31	English League	27
32	French League	4
33	PEU League	28
34	Liga Española	5
35	D2 League	10
36	Italian League	2
37	Portugal League	15
38	Brazilian League	12
39	PAS League	14
40	PDII League	21
41	PLA League	29
42	Argentine League	7
43	Chilean League	8
44	English 2nd division	30
45	Italian 2nd division	26
46	Colombian League	18
47	Serie A TIM	2
48	Ligue 1 Conforama	4
49	Liga BBVA	5
50	Primera División (ARG)	7
51	Superliga Quilmes Clásica	7
52	Primera División (CHL)	8
53	Campeonato Scotiabank	8
54	Campeonato AFP Planvital	8
55	Liga Adelante	10
56	Domino's Ligue 2	11
57	Campeonato Brasileiro	12
58	Spor Toto Süper Lig	13
59	Liga NOS	15
60	Russian Premier Liga	16
61	Liga Águila	18
62	Jupiler Pro League	19
63	Ladbrokes Premiership	20
64	Raiffeisen Super League	23
65	Superliga	24
66	3F Superliga	24
67	Serie BKT	26
68	Copa Santander Libertadores	3
69	Copa Libertadores 2011	3
70	Copa Libertadores 2012	3
71	Copa Libertadores 2013	3
72	Copa Libertadores 2014	3
73	Copa Libertadores 2015	3
74	Copa Sudamericana 2013	9
75	Copa Sudamericana 2014	9
76	Copa Sudamericana 2015	9
77	Classic Teams	\N
78	Otras Ligas	\N
79	German League	28
\.


--
-- Data for Name: match_stats; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.match_stats (id, match_id, home_possession, away_possession, home_shots, away_shots, home_penalties, away_penalties, home_free_kicks, away_free_kicks, home_corner_kicks, away_corner_kicks, home_offsides, away_offsides, home_fouls, away_fouls, home_yellow_cards, away_yellow_cards, home_red_cards, away_red_cards, home_shots_on_target, away_shots_on_target) FROM stdin;
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.matches (id, date, home_user_id, away_user_id, home_team_game_id, away_team_game_id, home_goals, away_goals, active) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, receiver_id, type, content, is_read, created_at, sender_id, match_id, friendship_id) FROM stdin;
3	18	friend_request	\N	f	2026-09-30 15:05:12.019311	19	\N	14
\.


--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.players (id, base_player_id, name) FROM stdin;
\.


--
-- Data for Name: regions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.regions (id, name) FROM stdin;
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.teams (id, base_team_id, name) FROM stdin;
194	\N	Arsenal
195	\N	Aston Villa
196	\N	Birmingham City
197	\N	Blackburn Rovers
198	\N	Bolton Wanderers
199	\N	Charlton Athletic
200	\N	Chelsea
201	\N	Liverpool
202	\N	Everton
203	\N	Manchester City
204	\N	Manchester United
205	\N	Middlesbrough
206	\N	Newcastle United
207	\N	Portsmouth
208	\N	Sunderland
209	\N	Fulham
210	\N	Tottenham Hotspur
211	\N	West Bromwich Albion
212	\N	West Ham United
213	\N	Wigan Athletic
214	\N	AC Ajaccio
215	\N	AS Monaco
216	\N	AJ Auxerre
217	\N	Girondins de Bordeaux
218	\N	Le Mans
219	\N	Lille
220	\N	Olympique Lyonnais
221	\N	FC Metz
222	\N	AS Nancy
223	\N	FC Nantes
224	\N	OGC Nice
225	\N	Olympique de Marseille
226	\N	Paris Saint-Germain
227	\N	RC Lens
228	\N	Stade Rennais
229	\N	AS Saint-Étienne
230	\N	FC Sochaux
231	\N	RC Strasbourg
232	\N	Toulouse
233	\N	Troyes
234	\N	FC Köln
235	\N	Arminia Bielefeld
236	\N	Bayer Leverkusen
237	\N	Bayern Munich
238	\N	Borussia Dortmund
239	\N	Borussia Mönchengladbach
240	\N	MSV Duisburg
241	\N	Eintracht Frankfurt
242	\N	Hamburger SV
243	\N	Hannover 96
244	\N	Hertha BSC
245	\N	Kaiserslautern
246	\N	Mainz 05
247	\N	Nürnberg
248	\N	Schalke 04
249	\N	VfB Stuttgart
250	\N	Wolfsburg
251	\N	Werder Bremen
252	\N	Atalanta
253	\N	Bologna
254	\N	Brescia
255	\N	Cagliari
256	\N	Chievo Verona
257	\N	Empoli
258	\N	Fiorentina
259	\N	Inter
260	\N	Juventus
261	\N	Lazio
262	\N	Lecce
263	\N	Livorno
264	\N	Messina
265	\N	Milan
266	\N	Palermo
267	\N	Parma
268	\N	Reggina
269	\N	Roma
270	\N	Sampdoria
271	\N	Udinese
272	\N	Athletic Bilbao
273	\N	Atlético Madrid
274	\N	Barcelona
275	\N	Betis
276	\N	Deportivo La Coruña
277	\N	Espanyol
278	\N	Getafe
279	\N	Málaga
280	\N	Mallorca
281	\N	Osasuna
282	\N	Racing Santander
283	\N	Real Madrid
284	\N	Real Sociedad
285	\N	Sevilla
286	\N	Valencia
287	\N	Villarreal
288	\N	Albacete
289	\N	Levante
290	\N	Numancia
291	\N	Zaragoza
292	\N	Ajax
293	\N	AZ
294	\N	ADO Den Haag
295	\N	Feyenoord
296	\N	FC Groningen
297	\N	FC Utrecht
298	\N	NAC Breda
299	\N	NEC Nijmegen
300	\N	PSV Eindhoven
301	\N	RKC Waalwijk
302	\N	RBC Roosendaal
303	\N	Roda JC
304	\N	SC Heerenveen
305	\N	Sparta Rotterdam
306	\N	Vitesse
307	\N	Willem II
308	\N	FC Twente
309	\N	VVV-Venlo
310	\N	Celtic
311	\N	Rangers
312	\N	FC Copenhagen
313	\N	Rosenborg
314	\N	Djurgårdens IF
315	\N	Galatasaray
316	\N	Dynamo Kyiv
317	\N	FC Porto
318	\N	Club Brugge
319	\N	Anderlecht
320	\N	Fenerbahçe
321	\N	Beşiktaş
322	\N	Olympiacos
323	\N	Panathinaikos
324	\N	Lokomotiv Moscow
325	\N	Shakhtar Donetsk
326	\N	Sparta Prague
327	\N	Benfica
328	\N	Sporting CP
329	\N	São Paulo
330	\N	Austria
331	\N	Bélgica
332	\N	Bulgaria
333	\N	Croacia
334	\N	República Checa
335	\N	Dinamarca
336	\N	Inglaterra
337	\N	Finlandia
338	\N	Francia
339	\N	Alemania
340	\N	Grecia
341	\N	Hungría
342	\N	Irlanda
343	\N	Italia
344	\N	Letonia
345	\N	Países Bajos
346	\N	Irlanda del Norte
347	\N	Noruega
348	\N	Polonia
349	\N	Portugal
350	\N	Rumania
351	\N	Rusia
352	\N	Escocia
353	\N	Serbia y Montenegro
354	\N	Eslovaquia
355	\N	Eslovenia
356	\N	España
357	\N	Suecia
358	\N	Suiza
359	\N	Turquía
360	\N	Ucrania
361	\N	Gales
362	\N	Camerún
363	\N	Costa de Marfil
364	\N	Marruecos
365	\N	Nigeria
366	\N	Senegal
367	\N	Sudáfrica
368	\N	Túnez
369	\N	Costa Rica
370	\N	México
371	\N	Estados Unidos
372	\N	Argentina
373	\N	Brasil
374	\N	Chile
375	\N	Colombia
376	\N	Ecuador
377	\N	Paraguay
378	\N	Perú
379	\N	Uruguay
380	\N	Venezuela
381	\N	Australia
382	\N	China
383	\N	Irán
384	\N	Japón
385	\N	Arabia Saudita
386	\N	Corea del Sur
391	195	West Midlands Village
392	196	West Midlands City
393	197	Lancashire
394	198	Middlebrook
395	199	South East London Reds
396	201	Merseyside Red
397	202	Merseyside Blue
398	203	Man Blue
399	204	Man Red
400	205	Teeside
401	206	Tyneside
402	207	Pompy
403	208	Wearside
404	209	West London White
405	210	North East London
406	211	West Midlands Stripes
407	212	East London
408	213	Lancashire Athletic
409	214	Corse Sud
410	215	Azur
411	216	Bourgogne
412	217	Aquitaine
413	218	Sarthe
414	219	Pas de Calais
415	220	Rhone
416	221	Moselle
417	222	Meurthe et Moselle
418	223	Loire Atlantique
419	224	Alpes Maritimes
420	225	Bouches du Rhone
421	226	Ile de France
422	227	Nord
423	228	Bretagne
424	229	Somesterrine
425	230	Franche Comte
426	231	Alsace
427	232	Garonne
428	233	Aube
429	234	Domstadt
430	235	Alm
431	236	Rhein
432	237	Isar
433	238	Westfalen
434	239	Fohlen
435	240	Stahlstadt
436	241	Rhein Main
437	242	Hanseaten
438	243	Niedersachsen
439	244	Hauptstadt
440	245	Pfalz
441	246	Karneval
442	247	Franken
443	248	Ruhr
444	249	Neckar
445	250	Autostadt
446	251	Weser
447	312	Copenhagen
448	314	Djurgården
449	317	Porto
450	318	FC Belgium
451	319	Bruxelles
452	320	Constanti
453	321	FC Bosphorus
454	322	Peloponnisos
455	323	Athenakos FC
456	324	Russia Rail FC
457	325	Sheffcor Domake
458	326	AC Czech
459	327	Lisbonera
460	328	Esportiva
461	329	Caopolo
462	\N	Heracles Almelo
463	\N	Siena
464	\N	Ascoli
465	\N	Treviso
466	\N	Celta
467	\N	Alaves
468	\N	Cadiz
469	\N	WE United
470	\N	PES United
471	\N	Derby County
472	\N	Reading
473	\N	SM Caen
474	\N	FC Lorient
475	\N	Valenciennes FC
476	\N	Catania
477	\N	Genoa
478	\N	Napoli
479	\N	Torino
480	\N	SBV Excelsior
481	\N	De Graafschap
482	\N	Almería
483	\N	Real Murcia
484	\N	R.C. Recreativo de Huelva
485	\N	Valladolid
486	\N	NK Dinamo Zagreb
487	\N	AEK Athens
488	\N	Wisla Krakow
489	\N	Spartak Moscow
490	\N	HJK Helsinki
491	\N	River Plate
492	\N	SC Internacional
493	\N	Red Star Belgrade
494	\N	AIK
495	\N	Hammarby
496	\N	Helsingborgs IF
497	\N	IFK Göteborg
498	\N	FC Basel 1893
499	\N	Israel
500	\N	Serbia
501	\N	Angola
502	\N	Ghana
503	\N	Togo
504	\N	Trinidad and Tobago
505	\N	Classic Argentina
506	\N	Classic Brazil
507	\N	Classic England
508	\N	Classic France
509	\N	Classic Germany
510	\N	Classic Italy
511	\N	Classic Netherlands
512	194	North London
513	200	London FC
514	205	Teesside
515	216	Auxerre
516	218	Le Mans UC 72
517	219	Lille OSC
518	222	AS Nancy-Lorrraine
519	225	Olympique Marseille
520	228	Stade Rennais FC
521	232	Toulouse FC
522	265	A.C. Milan
523	269	A.S. Roma
524	272	Athletic Club
525	273	C. Atlético Madrid
526	274	F.C. Barcelona
527	275	R. Betis
528	276	R.C. Deportivo La Coruña
529	277	R.C.D. Espanyol
530	278	Getafe C.F.
531	280	R.C.D. Mallorca
532	281	C.A. Osasuna
533	282	R. Racing C.
534	285	Sevilla F.C.
535	286	Valencia C.F.
536	287	Villarreal C.F.
537	289	Levante U.D.
538	291	R. Zaragoza
539	299	N.E.C. Nijmegen
540	300	PSV
541	312	F.C. Copenhagen
542	313	Rosenborg Ballklub
543	316	Dynamo Kiev
544	318	Club Brugge KV
545	319	RSC Anderletch
546	320	Fenerbahce SK
547	321	Besiktas
548	322	Olympiacos Piraeus
549	327	SL Benfica
550	328	Sporting Lisboa
551	471	Derbyshire
552	472	Berkshire Blues
553	487	AEK Athens FC
\.


--
-- Data for Name: teams_games; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.teams_games (id, team_id, game_id, league_id, region_id, logo_path) FROM stdin;
1	292	1	1	\N	\N
2	293	1	1	\N	\N
3	294	1	1	\N	\N
4	295	1	1	\N	\N
5	296	1	1	\N	\N
6	297	1	1	\N	\N
7	298	1	1	\N	\N
8	299	1	1	\N	\N
9	300	1	1	\N	\N
10	301	1	1	\N	\N
11	302	1	1	\N	\N
12	303	1	1	\N	\N
13	304	1	1	\N	\N
14	305	1	1	\N	\N
15	306	1	1	\N	\N
16	307	1	1	\N	\N
17	308	1	1	\N	\N
18	462	1	1	\N	\N
19	255	1	2	\N	\N
20	256	1	2	\N	\N
21	257	1	2	\N	\N
22	258	1	2	\N	\N
23	259	1	2	\N	\N
24	260	1	2	\N	\N
25	261	1	2	\N	\N
26	262	1	2	\N	\N
27	263	1	2	\N	\N
28	264	1	2	\N	\N
29	265	1	2	\N	\N
30	266	1	2	\N	\N
31	267	1	2	\N	\N
32	268	1	2	\N	\N
33	269	1	2	\N	\N
34	270	1	2	\N	\N
35	271	1	2	\N	\N
36	463	1	2	\N	\N
37	464	1	2	\N	\N
38	465	1	2	\N	\N
39	194	1	31	\N	\N
40	195	1	31	\N	\N
41	196	1	31	\N	\N
42	197	1	31	\N	\N
43	198	1	31	\N	\N
44	199	1	31	\N	\N
45	200	1	31	\N	\N
46	201	1	31	\N	\N
47	202	1	31	\N	\N
48	203	1	31	\N	\N
49	204	1	31	\N	\N
50	205	1	31	\N	\N
51	206	1	31	\N	\N
52	207	1	31	\N	\N
53	208	1	31	\N	\N
54	209	1	31	\N	\N
55	210	1	31	\N	\N
56	211	1	31	\N	\N
57	212	1	31	\N	\N
58	213	1	31	\N	\N
59	214	1	32	\N	\N
60	215	1	32	\N	\N
61	216	1	32	\N	\N
62	217	1	32	\N	\N
63	218	1	32	\N	\N
64	219	1	32	\N	\N
65	220	1	32	\N	\N
66	221	1	32	\N	\N
67	222	1	32	\N	\N
68	223	1	32	\N	\N
69	224	1	32	\N	\N
70	225	1	32	\N	\N
71	226	1	32	\N	\N
72	227	1	32	\N	\N
73	228	1	32	\N	\N
74	229	1	32	\N	\N
75	230	1	32	\N	\N
76	231	1	32	\N	\N
77	232	1	32	\N	\N
78	233	1	32	\N	\N
79	272	1	34	\N	\N
80	273	1	34	\N	\N
81	274	1	34	\N	\N
82	275	1	34	\N	\N
83	276	1	34	\N	\N
84	277	1	34	\N	\N
85	278	1	34	\N	\N
86	279	1	34	\N	\N
87	280	1	34	\N	\N
88	281	1	34	\N	\N
89	282	1	34	\N	\N
90	283	1	34	\N	\N
91	284	1	34	\N	\N
92	285	1	34	\N	\N
93	286	1	34	\N	\N
94	287	1	34	\N	\N
95	291	1	34	\N	\N
96	466	1	34	\N	\N
97	467	1	34	\N	\N
98	468	1	34	\N	\N
99	234	1	28	\N	\N
100	235	1	28	\N	\N
101	236	1	28	\N	\N
102	237	1	28	\N	\N
103	238	1	28	\N	\N
104	239	1	28	\N	\N
105	240	1	28	\N	\N
106	241	1	28	\N	\N
107	242	1	28	\N	\N
108	243	1	28	\N	\N
109	244	1	28	\N	\N
110	245	1	28	\N	\N
111	246	1	28	\N	\N
112	247	1	28	\N	\N
113	248	1	28	\N	\N
114	249	1	28	\N	\N
115	250	1	28	\N	\N
116	251	1	28	\N	\N
117	310	1	78	\N	\N
118	311	1	78	\N	\N
119	312	1	78	\N	\N
120	313	1	78	\N	\N
121	314	1	78	\N	\N
122	315	1	78	\N	\N
123	316	1	78	\N	\N
124	317	1	78	\N	\N
125	318	1	78	\N	\N
126	319	1	78	\N	\N
127	320	1	78	\N	\N
128	321	1	78	\N	\N
129	322	1	78	\N	\N
130	323	1	78	\N	\N
131	324	1	78	\N	\N
132	325	1	78	\N	\N
133	326	1	78	\N	\N
134	327	1	78	\N	\N
135	328	1	78	\N	\N
136	329	1	78	\N	\N
137	469	1	78	\N	\N
138	470	1	78	\N	\N
139	206	16	\N	\N	\N
140	210	16	\N	\N	\N
141	215	16	\N	\N	\N
142	217	16	\N	\N	\N
143	220	16	\N	\N	\N
144	221	16	\N	\N	\N
145	224	16	\N	\N	\N
146	226	16	\N	\N	\N
147	227	16	\N	\N	\N
148	229	16	\N	\N	\N
149	230	16	\N	\N	\N
150	231	16	\N	\N	\N
151	237	16	\N	\N	\N
152	252	16	\N	\N	\N
153	255	16	\N	\N	\N
154	257	16	\N	\N	\N
155	258	16	\N	\N	\N
156	259	16	\N	\N	\N
157	260	16	\N	\N	\N
158	261	16	\N	\N	\N
159	263	16	\N	\N	\N
160	266	16	\N	\N	\N
161	267	16	\N	\N	\N
162	268	16	\N	\N	\N
163	270	16	\N	\N	\N
164	271	16	\N	\N	\N
165	283	16	\N	\N	\N
166	292	16	\N	\N	\N
167	293	16	\N	\N	\N
168	295	16	\N	\N	\N
169	296	16	\N	\N	\N
170	297	16	\N	\N	\N
171	298	16	\N	\N	\N
172	303	16	\N	\N	\N
173	304	16	\N	\N	\N
174	305	16	\N	\N	\N
175	306	16	\N	\N	\N
176	307	16	\N	\N	\N
177	308	16	\N	\N	\N
178	309	16	\N	\N	\N
179	310	16	\N	\N	\N
180	311	16	\N	\N	\N
181	315	16	\N	\N	\N
182	317	16	\N	\N	\N
183	323	16	\N	\N	\N
184	324	16	\N	\N	\N
185	330	16	\N	\N	\N
186	331	16	\N	\N	\N
187	332	16	\N	\N	\N
188	333	16	\N	\N	\N
189	334	16	\N	\N	\N
190	335	16	\N	\N	\N
191	336	16	\N	\N	\N
192	337	16	\N	\N	\N
193	338	16	\N	\N	\N
194	339	16	\N	\N	\N
195	340	16	\N	\N	\N
196	341	16	\N	\N	\N
197	342	16	\N	\N	\N
198	343	16	\N	\N	\N
199	345	16	\N	\N	\N
200	346	16	\N	\N	\N
201	347	16	\N	\N	\N
202	348	16	\N	\N	\N
203	349	16	\N	\N	\N
204	350	16	\N	\N	\N
205	351	16	\N	\N	\N
206	352	16	\N	\N	\N
207	354	16	\N	\N	\N
208	355	16	\N	\N	\N
209	356	16	\N	\N	\N
210	357	16	\N	\N	\N
211	358	16	\N	\N	\N
212	359	16	\N	\N	\N
213	360	16	\N	\N	\N
214	361	16	\N	\N	\N
215	362	16	\N	\N	\N
216	363	16	\N	\N	\N
217	365	16	\N	\N	\N
218	367	16	\N	\N	\N
219	368	16	\N	\N	\N
220	369	16	\N	\N	\N
221	370	16	\N	\N	\N
222	371	16	\N	\N	\N
223	372	16	\N	\N	\N
224	373	16	\N	\N	\N
225	374	16	\N	\N	\N
226	375	16	\N	\N	\N
227	376	16	\N	\N	\N
228	377	16	\N	\N	\N
229	378	16	\N	\N	\N
230	379	16	\N	\N	\N
231	381	16	\N	\N	\N
232	383	16	\N	\N	\N
233	384	16	\N	\N	\N
234	385	16	\N	\N	\N
235	386	16	\N	\N	\N
236	391	16	\N	\N	\N
237	392	16	\N	\N	\N
238	393	16	\N	\N	\N
239	394	16	\N	\N	\N
240	396	16	\N	\N	\N
241	397	16	\N	\N	\N
242	398	16	\N	\N	\N
243	399	16	\N	\N	\N
244	402	16	\N	\N	\N
245	403	16	\N	\N	\N
246	404	16	\N	\N	\N
247	407	16	\N	\N	\N
248	408	16	\N	\N	\N
249	462	16	\N	\N	\N
250	463	16	\N	\N	\N
251	469	16	\N	\N	\N
252	470	16	\N	\N	\N
253	473	16	\N	\N	\N
254	474	16	\N	\N	\N
255	475	16	\N	\N	\N
256	476	16	\N	\N	\N
257	477	16	\N	\N	\N
258	478	16	\N	\N	\N
259	479	16	\N	\N	\N
260	480	16	\N	\N	\N
261	481	16	\N	\N	\N
262	482	16	\N	\N	\N
263	483	16	\N	\N	\N
264	484	16	\N	\N	\N
265	485	16	\N	\N	\N
266	486	16	\N	\N	\N
267	488	16	\N	\N	\N
268	489	16	\N	\N	\N
269	490	16	\N	\N	\N
270	491	16	\N	\N	\N
271	492	16	\N	\N	\N
272	493	16	\N	\N	\N
273	494	16	\N	\N	\N
274	495	16	\N	\N	\N
275	496	16	\N	\N	\N
276	497	16	\N	\N	\N
277	498	16	\N	\N	\N
278	499	16	\N	\N	\N
279	500	16	\N	\N	\N
280	501	16	\N	\N	\N
281	502	16	\N	\N	\N
282	503	16	\N	\N	\N
283	504	16	\N	\N	\N
284	505	16	\N	\N	\N
285	506	16	\N	\N	\N
286	507	16	\N	\N	\N
287	508	16	\N	\N	\N
288	509	16	\N	\N	\N
289	510	16	\N	\N	\N
290	511	16	\N	\N	\N
291	512	16	\N	\N	\N
292	513	16	\N	\N	\N
293	514	16	\N	\N	\N
294	515	16	\N	\N	\N
295	516	16	\N	\N	\N
296	517	16	\N	\N	\N
297	518	16	\N	\N	\N
298	519	16	\N	\N	\N
299	520	16	\N	\N	\N
300	521	16	\N	\N	\N
301	522	16	\N	\N	\N
302	523	16	\N	\N	\N
303	524	16	\N	\N	\N
304	525	16	\N	\N	\N
305	526	16	\N	\N	\N
306	527	16	\N	\N	\N
307	528	16	\N	\N	\N
308	529	16	\N	\N	\N
309	530	16	\N	\N	\N
310	531	16	\N	\N	\N
311	532	16	\N	\N	\N
312	533	16	\N	\N	\N
313	534	16	\N	\N	\N
314	535	16	\N	\N	\N
315	536	16	\N	\N	\N
316	537	16	\N	\N	\N
317	538	16	\N	\N	\N
318	539	16	\N	\N	\N
319	540	16	\N	\N	\N
320	541	16	\N	\N	\N
321	542	16	\N	\N	\N
322	543	16	\N	\N	\N
323	544	16	\N	\N	\N
324	545	16	\N	\N	\N
325	546	16	\N	\N	\N
326	547	16	\N	\N	\N
327	548	16	\N	\N	\N
328	549	16	\N	\N	\N
329	550	16	\N	\N	\N
330	551	16	\N	\N	\N
331	552	16	\N	\N	\N
332	553	16	\N	\N	\N
\.


--
-- Data for Name: teams_games_players; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.teams_games_players (id, team_game_id, player_id) FROM stdin;
\.


--
-- Data for Name: user_friends; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_friends (user_id, friend_id, status, created_at, id) FROM stdin;
19	18	Pending	2026-09-30 15:05:11.836841	14
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, nickname, email, password, auth_id, auth_provider, created_at, verified) FROM stdin;
18	sanalb23	sanalbor32@gmail.com	$2b$10$A1Qae/Iq9B/gQFr9dOnwf.LRZYOJYG60BnVZERXjua4oS2u1OIdO6	\N	local	2026-09-19 04:50:27.099587	f
19	elsantac	santaxbygp@gmail.com	$2b$10$OLBTBhdUPRngArnP8RZlT.vs40gY4HQIyW69mk.yO9PwuNW.mILGO	\N	local	2026-09-19 04:51:12.99858	f
24	ITsF4CU	facundoleonel40@gmail.com	$2b$10$e4/jSAARvQ7/eBvuuKePR.A63evXHmjlpw39i7Ub/ot16yUb6VDce	\N	local	2026-10-14 03:57:49.889832	f
27	ITsF4CUNDO	facundoleonel45@gmail.com	$2b$10$mudCfAU1S7sFtf1qhTx3t.ilEY4DrSzVCCVrymbYlqmnKu0B.PVXe	\N	local	2026-10-14 04:03:39.902365	f
28	Facundo	fernandezfacundoleonel40@gmail.com	$2b$10$TeRIuQdzy/F2QKfkfUxhj.FZH6stS88OaOVqf.BLE5nbXxF8EXBhq	\N	local	2026-10-24 07:23:14.15125	f
29	ALAVERGA	facundoleonel22@gmail.com	$2b$10$JxDXNwSzvdWS8tqHTyjKqu3dzhsTo3OQ9wMlFOmUUrzHH1QfOzSMO	\N	local	2026-10-24 08:04:12.127043	f
\.


--
-- Name: games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.games_id_seq', 16, true);


--
-- Name: leagues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.leagues_id_seq', 79, true);


--
-- Name: match_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.match_stats_id_seq', 6, true);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.matches_id_seq', 15, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 6, true);


--
-- Name: players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.players_id_seq', 1, false);


--
-- Name: regions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.regions_id_seq', 1, false);


--
-- Name: teams_games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.teams_games_id_seq', 332, true);


--
-- Name: teams_games_players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.teams_games_players_id_seq', 1, false);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.teams_id_seq', 553, true);


--
-- Name: user_friends_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_friends_id_seq', 14, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 29, true);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: leagues leagues_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT leagues_name_key UNIQUE (name);


--
-- Name: leagues leagues_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT leagues_pkey PRIMARY KEY (id);


--
-- Name: match_stats match_stats_match_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.match_stats
    ADD CONSTRAINT match_stats_match_id_key UNIQUE (match_id);


--
-- Name: match_stats match_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.match_stats
    ADD CONSTRAINT match_stats_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: players players_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_name_key UNIQUE (name);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: regions regions_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_name_key UNIQUE (name);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- Name: teams_games teams_games_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games
    ADD CONSTRAINT teams_games_pkey PRIMARY KEY (id);


--
-- Name: teams_games_players teams_games_players_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games_players
    ADD CONSTRAINT teams_games_players_pkey PRIMARY KEY (id);


--
-- Name: teams teams_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_name_key UNIQUE (name);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: users unique_social_login; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_social_login UNIQUE (auth_provider, auth_id);


--
-- Name: teams_games_players uq_teams_games_players; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games_players
    ADD CONSTRAINT uq_teams_games_players UNIQUE (team_game_id, player_id);


--
-- Name: teams_games uq_teams_games_team_game; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games
    ADD CONSTRAINT uq_teams_games_team_game UNIQUE (team_id, game_id);


--
-- Name: user_friends user_friends_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_friends
    ADD CONSTRAINT user_friends_pkey PRIMARY KEY (id);


--
-- Name: users users_auth_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_nickname_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_nickname_key UNIQUE (nickname);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: prevent_inverted_friendships; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX prevent_inverted_friendships ON public.user_friends USING btree (LEAST(user_id, friend_id), GREATEST(user_id, friend_id));


--
-- Name: matches fk_away_team_game; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT fk_away_team_game FOREIGN KEY (away_team_game_id) REFERENCES public.teams_games(id);


--
-- Name: matches fk_away_user; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT fk_away_user FOREIGN KEY (away_user_id) REFERENCES public.users(id);


--
-- Name: leagues fk_canon_league; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT fk_canon_league FOREIGN KEY (base_league_id) REFERENCES public.leagues(id) ON DELETE SET NULL;


--
-- Name: players fk_canon_player; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT fk_canon_player FOREIGN KEY (base_player_id) REFERENCES public.players(id) ON DELETE SET NULL;


--
-- Name: teams fk_canon_team; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT fk_canon_team FOREIGN KEY (base_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: user_friends fk_friend; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_friends
    ADD CONSTRAINT fk_friend FOREIGN KEY (friend_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teams_games fk_game; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games
    ADD CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: matches fk_home_team_game; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT fk_home_team_game FOREIGN KEY (home_team_game_id) REFERENCES public.teams_games(id);


--
-- Name: matches fk_home_user; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT fk_home_user FOREIGN KEY (home_user_id) REFERENCES public.users(id);


--
-- Name: teams_games fk_league; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games
    ADD CONSTRAINT fk_league FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE SET NULL;


--
-- Name: match_stats fk_match; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.match_stats
    ADD CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: teams_games_players fk_player; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games_players
    ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: teams_games fk_region; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games
    ADD CONSTRAINT fk_region FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE SET NULL;


--
-- Name: teams_games fk_team; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games
    ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: teams_games_players fk_team_game; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams_games_players
    ADD CONSTRAINT fk_team_game FOREIGN KEY (team_game_id) REFERENCES public.teams_games(id) ON DELETE CASCADE;


--
-- Name: user_friends fk_user; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_friends
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications friendship_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT friendship_fk FOREIGN KEY (friendship_id) REFERENCES public.user_friends(id) ON DELETE CASCADE;


--
-- Name: notifications match_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT match_id_fk FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: notifications receiver_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT receiver_id_fk FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications sender_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT sender_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict CoZal2JeiQn7j4O3g5SvlI8Hof2mHTIBYKvb6vVari3aSeCmcNrg7rZooQU0YRO

