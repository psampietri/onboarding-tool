--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: psampietri
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(255) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer,
    details jsonb,
    ip_address character varying(50),
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO psampietri;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: psampietri
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO psampietri;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psampietri
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: psampietri
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    body_template text NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_templates OWNER TO psampietri;

--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: psampietri
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.email_templates_id_seq OWNER TO psampietri;

--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psampietri
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: psampietri
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    is_read boolean DEFAULT false,
    related_entity_type character varying(50),
    related_entity_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'success'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO psampietri;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: psampietri
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO psampietri;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psampietri
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: onboarding_instances; Type: TABLE; Schema: public; Owner: psampietri
--

CREATE TABLE public.onboarding_instances (
    id integer NOT NULL,
    user_id integer,
    onboarding_template_id integer,
    status character varying(50) DEFAULT 'not_started'::character varying NOT NULL,
    assigned_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT onboarding_instances_status_check CHECK (((status)::text = ANY ((ARRAY['not_started'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.onboarding_instances OWNER TO psampietri;

--
-- Name: onboarding_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: psampietri
--

CREATE SEQUENCE public.onboarding_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.onboarding_instances_id_seq OWNER TO psampietri;

--
-- Name: onboarding_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psampietri
--

ALTER SEQUENCE public.onboarding_instances_id_seq OWNED BY public.onboarding_instances.id;


--
-- Name: onboarding_template_tasks; Type: TABLE; Schema: public; Owner: psampietri
--

CREATE TABLE public.onboarding_template_tasks (
    onboarding_template_id integer NOT NULL,
    task_template_id integer NOT NULL,
    "order" integer
);


ALTER TABLE public.onboarding_template_tasks OWNER TO psampietri;

--
-- Name: onboarding_templates; Type: TABLE; Schema: public; Owner: psampietri
--

CREATE TABLE public.onboarding_templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.onboarding_templates OWNER TO psampietri;

--
-- Name: onboarding_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: psampietri
--

CREATE SEQUENCE public.onboarding_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.onboarding_templates_id_seq OWNER TO psampietri;

--
-- Name: onboarding_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psampietri
--

ALTER SEQUENCE public.onboarding_templates_id_seq OWNED BY public.onboarding_templates.id;


--
-- Name: task_instances; Type: TABLE; Schema: public; Owner: psampietri
--

CREATE TABLE public.task_instances (
    id integer NOT NULL,
    onboarding_instance_id integer,
    task_template_id integer,
    status character varying(50) DEFAULT 'not_started'::character varying NOT NULL,
    ticket_info jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    issue_key text,
    is_bypassed boolean DEFAULT false,
    task_started_at timestamp with time zone,
    task_completed_at timestamp with time zone,
    ticket_created_at timestamp with time zone,
    ticket_closed_at timestamp with time zone,
    CONSTRAINT task_instances_status_check CHECK (((status)::text = ANY ((ARRAY['not_started'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[])))
);


ALTER TABLE public.task_instances OWNER TO psampietri;

--
-- Name: task_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: psampietri
--

CREATE SEQUENCE public.task_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_instances_id_seq OWNER TO psampietri;

--
-- Name: task_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psampietri
--

ALTER SEQUENCE public.task_instances_id_seq OWNED BY public.task_instances.id;


--
-- Name: task_template_dependencies; Type: TABLE; Schema: public; Owner: psampietri
--

CREATE TABLE public.task_template_dependencies (
    task_template_id integer NOT NULL,
    depends_on_id integer NOT NULL
);


ALTER TABLE public.task_template_dependencies OWNER TO psampietri;

--
-- Name: task_templates; Type: TABLE; Schema: public; Owner: psampietri
--

CREATE TABLE public.task_templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    task_type character varying(50) NOT NULL,
    config jsonb,
    created_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    instructions text,
    CONSTRAINT task_templates_task_type_check CHECK (((task_type)::text = ANY ((ARRAY['manual'::character varying, 'manual_access_request'::character varying, 'automated_access_request'::character varying])::text[])))
);


ALTER TABLE public.task_templates OWNER TO psampietri;

--
-- Name: task_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: psampietri
--

CREATE SEQUENCE public.task_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_templates_id_seq OWNER TO psampietri;

--
-- Name: task_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psampietri
--

ALTER SEQUENCE public.task_templates_id_seq OWNED BY public.task_templates.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: psampietri
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "Surname" text,
    "KUMS_ID" text,
    "ART" text,
    "Team_Name" text,
    "Contact_Person" text,
    "Vendor_ID" text,
    "CIANDT_GitHub_Username" text,
    start_date text,
    location text,
    team_role text,
    audi_email text,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO psampietri;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: psampietri
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO psampietri;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psampietri
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: onboarding_instances id; Type: DEFAULT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_instances ALTER COLUMN id SET DEFAULT nextval('public.onboarding_instances_id_seq'::regclass);


--
-- Name: onboarding_templates id; Type: DEFAULT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_templates ALTER COLUMN id SET DEFAULT nextval('public.onboarding_templates_id_seq'::regclass);


--
-- Name: task_instances id; Type: DEFAULT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.task_instances ALTER COLUMN id SET DEFAULT nextval('public.task_instances_id_seq'::regclass);


--
-- Name: task_templates id; Type: DEFAULT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.task_templates ALTER COLUMN id SET DEFAULT nextval('public.task_templates_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: psampietri
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: psampietri
--

COPY public.email_templates (id, name, subject, body_template, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: psampietri
--

COPY public.notifications (id, user_id, title, message, type, is_read, related_entity_type, related_entity_id, created_at) FROM stdin;
\.


--
-- Data for Name: onboarding_instances; Type: TABLE DATA; Schema: public; Owner: psampietri
--

COPY public.onboarding_instances (id, user_id, onboarding_template_id, status, assigned_by, created_at, updated_at) FROM stdin;
4	15	6	in_progress	6	2025-08-13 17:18:32.113594-03	2025-08-14 18:42:29.221213-03
\.


--
-- Data for Name: onboarding_template_tasks; Type: TABLE DATA; Schema: public; Owner: psampietri
--

COPY public.onboarding_template_tasks (onboarding_template_id, task_template_id, "order") FROM stdin;
6	26	1
6	33	3
6	27	4
6	30	5
6	13	6
6	35	7
6	16	8
6	17	9
6	19	10
6	22	11
6	29	12
6	28	13
6	15	14
6	24	15
6	31	16
6	25	17
6	18	18
6	23	19
6	34	20
6	11	21
6	14	22
6	21	23
6	20	24
6	12	25
6	36	26
6	63	27
6	61	28
6	62	29
6	58	30
6	57	31
6	50	32
6	52	33
6	53	34
6	54	35
6	51	36
6	60	37
6	59	38
6	55	39
6	56	40
6	64	41
6	37	42
\.


--
-- Data for Name: onboarding_templates; Type: TABLE DATA; Schema: public; Owner: psampietri
--

COPY public.onboarding_templates (id, name, description, created_by, created_at, updated_at) FROM stdin;
6	DEV - Prod Support		6	2025-08-12 17:28:12.684062-03	2025-08-13 17:18:18.06651-03
\.


--
-- Data for Name: task_instances; Type: TABLE DATA; Schema: public; Owner: psampietri
--

COPY public.task_instances (id, onboarding_instance_id, task_template_id, status, ticket_info, created_at, updated_at, issue_key, is_bypassed, task_started_at, task_completed_at, ticket_created_at, ticket_closed_at) FROM stdin;
56	4	20	completed	{"key": "RITM0280266"}	2025-08-13 17:18:32.113594-03	2025-08-15 13:35:13.406546-03	\N	f	\N	2025-08-15 13:35:13.406-03	2025-07-25 18:51:00-03	2025-07-28 10:26:00-03
71	4	55	in_progress	{"key": "MSIS-14636"}	2025-08-13 17:18:32.113594-03	2025-08-15 14:44:35.866345-03	\N	f	2025-08-15 14:43:51.865-03	\N	2025-08-15 14:43:51.865-03	\N
55	4	21	completed	{"key": "RITM0280267"}	2025-08-13 17:18:32.113594-03	2025-08-15 13:36:20.705232-03	\N	f	\N	2025-08-15 13:36:20.705-03	2025-07-25 18:51:00-03	2025-07-28 10:27:00-03
47	4	24	completed	{"key": "RITM0280441"}	2025-08-13 17:18:32.113594-03	2025-08-15 13:38:03.513667-03	\N	f	\N	2025-08-15 13:38:03.513-03	2025-07-28 15:07:00-03	2025-08-06 08:07:00-03
58	4	36	in_progress	{"key": "MYAAPPJSM-1460"}	2025-08-13 17:18:32.113594-03	2025-08-15 14:53:12.77861-03	\N	f	2025-08-15 14:52:25.776-03	\N	2025-08-15 14:52:25.776-03	\N
33	4	26	completed	{"key": "RITM0280452"}	2025-08-13 17:18:32.113594-03	2025-08-15 13:39:22.070041-03	\N	f	\N	2025-08-15 13:39:22.069-03	2025-07-28 15:29:00-03	2025-07-30 09:17:00-03
42	4	19	completed	{"key": "RITM0280635"}	2025-08-13 17:18:32.113594-03	2025-08-15 13:43:13.476578-03	\N	f	\N	2025-08-15 13:43:13.476-03	2025-07-29 13:17:00-03	2025-08-06 07:23:00-03
35	4	33	completed	{"key": "OAJSM-2022"}	2025-08-13 17:18:32.113594-03	2025-08-15 13:54:40.443993-03	\N	f	\N	2025-08-15 13:54:40.443-03	\N	\N
68	4	51	completed	{"key": "OAJSM-2022"}	2025-08-13 17:18:32.113594-03	2025-08-15 13:57:15.785033-03	\N	f	\N	2025-08-15 13:57:15.784-03	\N	\N
65	4	52	completed	{"key": "MSIS-14384"}	2025-08-13 17:18:32.113594-03	2025-08-15 13:58:57.299979-03	\N	f	\N	2025-08-15 13:58:57.299-03	\N	\N
64	4	50	completed	{"key": "MSIS-14385"}	2025-08-13 17:18:32.113594-03	2025-08-15 13:59:17.800366-03	\N	f	\N	2025-08-15 13:59:17.8-03	\N	\N
66	4	53	completed	{"key": "MSIS-14386"}	2025-08-13 17:18:32.113594-03	2025-08-15 13:59:40.900916-03	\N	f	\N	2025-08-15 13:59:40.9-03	\N	\N
74	4	37	in_progress	{"key": "MSIS-14387"}	2025-08-13 17:18:32.113594-03	2025-08-15 14:00:03.128026-03	\N	f	2025-08-15 14:00:03.127-03	\N	\N	\N
46	4	15	completed	\N	2025-08-13 17:18:32.113594-03	2025-08-14 14:33:47.922933-03	\N	f	\N	\N	\N	\N
53	4	11	completed	\N	2025-08-13 17:18:32.113594-03	2025-08-14 14:34:13.551647-03	\N	f	\N	\N	\N	\N
57	4	12	completed	\N	2025-08-13 17:18:32.113594-03	2025-08-14 14:34:22.063767-03	\N	f	\N	\N	\N	\N
38	4	13	completed	\N	2025-08-13 17:18:32.113594-03	2025-08-14 19:22:44.077726-03	\N	f	\N	2025-08-14 19:22:44.074-03	\N	\N
50	4	18	completed	\N	2025-08-13 17:18:32.113594-03	2025-08-14 19:23:38.814716-03	\N	f	\N	2025-08-14 19:23:38.814-03	\N	\N
41	4	17	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
43	4	22	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
44	4	29	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
45	4	28	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
49	4	25	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
51	4	23	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
52	4	34	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
54	4	14	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
62	4	58	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
63	4	57	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
69	4	60	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
70	4	59	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
72	4	56	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
73	4	64	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-13 17:18:32.113594-03	\N	f	\N	\N	\N	\N
36	4	27	not_started	\N	2025-08-13 17:18:32.113594-03	2025-08-14 14:02:03.257784-03	\N	f	\N	\N	\N	\N
37	4	30	completed	{"key": "MSIS-12479"}	2025-08-13 17:18:32.113594-03	2025-08-14 19:31:32.523583-03	\N	f	\N	2025-08-14 19:31:32.523-03	\N	\N
59	4	63	completed	{"key": "WEBSUPPORT-54356"}	2025-08-13 17:18:32.113594-03	2025-08-14 19:35:55.105944-03	\N	f	\N	2025-08-14 19:35:55.105-03	2025-06-17 18:24:00-03	2025-08-08 05:12:00-03
67	4	54	completed	{"key": "MSIS-12481"}	2025-08-13 17:18:32.113594-03	2025-08-14 19:45:49.602607-03	\N	f	\N	2025-08-14 19:45:49.602-03	\N	\N
61	4	62	in_progress	{"key": "MSIS-13682"}	2025-08-13 17:18:32.113594-03	2025-08-14 19:46:01.435837-03	\N	f	2025-08-14 19:46:01.435-03	2025-08-14 19:42:26.529-03	\N	\N
60	4	61	in_progress	{"key": "MSIS-13787"}	2025-08-13 17:18:32.113594-03	2025-08-14 19:46:08.405453-03	\N	f	2025-08-14 19:46:08.405-03	2025-08-14 19:42:10.883-03	\N	\N
40	4	16	completed	\N	2025-08-13 17:18:32.113594-03	2025-08-14 19:47:02.652194-03	\N	f	\N	2025-08-14 19:47:02.651-03	\N	\N
39	4	35	completed	\N	2025-08-13 17:18:32.113594-03	2025-08-14 19:47:06.649356-03	\N	f	\N	2025-08-14 19:47:06.648-03	\N	\N
48	4	31	in_progress	{"key": "OAJSM-2034"}	2025-08-13 17:18:32.113594-03	2025-08-15 14:24:36.151528-03	\N	f	2025-08-15 14:23:32.855-03	2025-08-15 14:23:35.049-03	2025-08-15 14:23:32.855-03	2025-08-15 14:23:35.049-03
\.


--
-- Data for Name: task_template_dependencies; Type: TABLE DATA; Schema: public; Owner: psampietri
--

COPY public.task_template_dependencies (task_template_id, depends_on_id) FROM stdin;
13	12
14	13
16	13
17	12
18	13
22	13
23	13
24	13
25	13
26	13
27	13
28	13
34	13
35	16
30	18
31	15
31	18
36	13
36	18
37	18
50	18
52	18
53	18
51	18
55	18
56	55
20	13
21	13
57	13
57	20
60	13
60	12
58	13
58	12
59	13
59	12
54	18
61	18
62	18
33	13
33	12
19	12
29	13
64	13
64	12
63	12
63	13
\.


--
-- Data for Name: task_templates; Type: TABLE DATA; Schema: public; Owner: psampietri
--

COPY public.task_templates (id, name, description, task_type, config, created_by, created_at, updated_at, instructions) FROM stdin;
52	NARCHARGE Jira Project	Request access to NARCHARGE Jira Project	automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_12201": {"type": "static", "value": "https://collaboration.msi.audi.com/jira/projects/NARCHARGE/"}, "customfield_22504": {"type": "dynamic", "value": "audi_email"}}, "requestTypeId": "780", "serviceDeskId": "45"}}	6	2025-08-13 15:36:30.936101-03	2025-08-13 15:40:50.820763-03	
51	OneAudiNAR Confluence Space	Request access to OneAudiNAR Confluence Space	automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_12201": {"type": "static", "value": "https://collaboration.msi.audi.com/confluence/spaces/AAA/pages/113937164/OneAudiNAR+Home"}, "customfield_22504": {"type": "dynamic", "value": "audi_email"}}, "requestTypeId": "780", "serviceDeskId": "45"}}	6	2025-08-13 15:36:30.920897-03	2025-08-13 15:45:45.881783-03	
55	RocketChat Access	Request access to RocketChat	automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_12201": {"type": "static", "value": "https://chat.collaboration.msi.audi.com/"}, "customfield_22504": {"type": "dynamic", "value": "audi_email"}}, "requestTypeId": "780", "serviceDeskId": "45"}}	6	2025-08-13 15:47:11.466229-03	2025-08-13 15:47:54.226714-03	
58	Customer Registration Launch Darkly Project	Request access to Customer Registration Launch Darkly Project	manual_access_request	{}	6	2025-08-13 17:00:23.987912-03	2025-08-13 17:04:51.276547-03	https://vwgoaprod1.service-now.com/sp?id=sc_cat_item&sys_id=77bdbbae1b267854e82253de034bcbe3\n\nDeveloper: AUDIUSA_CUSTOMERREGISTRATION_DEVELOPER\nQA: AUDIUSA_CUSTOMERREGISTRATION_RELEASEMANAGER
59	Premium Charging Experience (PCE) Launch Darkly Project	Request access to Premium Charging Experience (PCE) Launch Darkly Project	manual_access_request	{}	6	2025-08-13 17:00:28.883865-03	2025-08-13 17:05:25.845994-03	https://vwgoaprod1.service-now.com/sp?id=sc_cat_item&sys_id=77bdbbae1b267854e82253de034bcbe3\n\nDeveloper: AUDIUSA_PCE_DEVELOPER\nQA: AUDIUSA_PCE_RELEASEMANAGER
62	CSS1 Confluence Space	Request access to CSS1 Confluence Space	automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_12201": {"type": "static", "value": "https://collaboration.msi.audi.com/confluence/spaces/CSS1/"}, "customfield_22504": {"type": "dynamic", "value": "audi_email"}}, "requestTypeId": "780", "serviceDeskId": "45"}}	6	2025-08-13 17:08:36.521027-03	2025-08-13 17:09:02.672104-03	
34	SC3		manual	{}	6	2025-08-12 17:17:50.395711-03	2025-08-12 17:17:50.395711-03	Send an email to AG contact
35	Audi SF Slack Channels	Add to relevant team's slack channels	manual	{}	6	2025-08-12 17:18:29.997335-03	2025-08-12 17:18:29.997335-03	
13	Audi Email	Submit request for Audi Email creation	manual_access_request	{}	6	2025-08-12 16:56:12.474181-03	2025-08-12 16:56:12.474181-03	
12	Vendor ID	Submit Vendor ID request in my.serve	manual_access_request	{}	6	2025-08-12 16:55:01.992764-03	2025-08-12 16:57:09.228547-03	RSA Token and KUMS ID should be automatically requested in this step
14	VPN	Setup VPN	manual	{}	6	2025-08-12 16:57:58.741633-03	2025-08-12 16:57:58.741633-03	
15	GitHub Account	Create GitHub Account with CI&T email	manual	{}	6	2025-08-12 16:58:38.551259-03	2025-08-12 16:58:38.551259-03	
11	Team's email group	Add to team's email group	manual	{}	6	2025-08-12 16:52:55.472187-03	2025-08-12 16:58:46.033374-03	
16	Audi SF Slack Workspace	Add user to the main Audi Slack Workspace	manual	{}	6	2025-08-12 16:59:47.051596-03	2025-08-12 17:00:03.951578-03	
17	CARIAD Slack Workspace	Add user to the CARIAD Slack Workspace	manual	{}	6	2025-08-12 17:00:55.808193-03	2025-08-12 17:00:55.808193-03	
53	ONAUDINAR Jira Project	Request access to ONAUDINAR Jira Project	automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_12201": {"type": "static", "value": "https://collaboration.msi.audi.com/jira/projects/ONAUDINAR"}, "customfield_22504": {"type": "dynamic", "value": "audi_email"}}, "requestTypeId": "780", "serviceDeskId": "45"}}	6	2025-08-13 15:41:26.364441-03	2025-08-13 15:41:58.123609-03	
56	RocketChat Channels	Add user to RocketChat Channels	manual	{}	6	2025-08-13 15:48:29.421431-03	2025-08-13 15:48:29.421431-03	
20	Prod Support Jira Project	Request Access to the Prod Support Jira Project	manual_access_request	{}	6	2025-08-12 17:04:07.605715-03	2025-08-13 16:51:52.901846-03	My.serve request
21	Prod Support Confluence Space	Request access to the Prod Support Confluence Space	manual_access_request	{}	6	2025-08-12 17:04:47.950657-03	2025-08-13 16:52:11.021547-03	my.serve request
60	Online Service Scheduler Launch Darkly Project	Request access to Online Service Scheduler Launch Darkly Project	manual_access_request	{}	6	2025-08-13 17:01:33.75996-03	2025-08-13 17:04:20.731092-03	https://vwgoaprod1.service-now.com/sp?id=sc_cat_item&sys_id=77bdbbae1b267854e82253de034bcbe3\n\nDeveloper: AUDIUSA_OSS_DEVELOPER\nQA: AUDIUSA_OSS_RELEASEMANAGER
19	DevStack Account	Request DevStack Access	manual_access_request	{}	6	2025-08-12 17:02:37.264023-03	2025-08-13 17:10:39.427436-03	Submit a my.serve request\n\nhttps://vwgoaprod1.service-now.com/sp?id=sc_cat_item&sys_id=062ea1f41b830d10a78fcb7c2b4bcbfb
29	Figma	Request access to Audi's figma space	manual	{}	6	2025-08-12 17:11:02.700113-03	2025-08-13 17:11:20.302474-03	https://vwgoaprod1.service-now.com/sp?id=sc_cat_item&sys_id=e8daa03493f09ad4c954b8084dba1031
63	AEM Headless (Falcon)	Request AEM Headless (Falcon) access	manual_access_request	{}	6	2025-08-13 17:14:22.923127-03	2025-08-14 19:48:21.350004-03	Open a WEBSUPPORT ticket\n\nKUMS ID email must match the email in the request\n\nTicket example: https://collaboration.msi.audi.com/jira/browse/WEBSUPPORT-54354
18	MSI Account	Request MSI Account	manual	{}	6	2025-08-12 17:01:38.576688-03	2025-08-12 17:01:38.576688-03	Send an email to your Audi AG contact requesting the user creation
22	Electrify America Jira		manual	{}	6	2025-08-12 17:05:28.263854-03	2025-08-12 17:05:28.263854-03	Send email to Ivan Forero
23	Quartett Mobile Jira		manual_access_request	{}	6	2025-08-12 17:05:55.843672-03	2025-08-12 17:05:55.843672-03	TBD
24	GitHub EMU	Request Access to GitHub EMU	manual_access_request	{}	6	2025-08-12 17:06:34.942349-03	2025-08-12 17:06:34.942349-03	my.serve request - select your team group
25	Launch Darkly	Request LD access	manual_access_request	{}	6	2025-08-12 17:07:41.06847-03	2025-08-12 17:07:41.06847-03	my.serve request. Groups:\nOSS\nCustomer Registration \nPCE - Premium Charging Experience
26	/Flow	Request access to /Flow Audi Tenant	manual_access_request	{}	6	2025-08-12 17:08:18.85514-03	2025-08-12 17:08:18.85514-03	my.serve access
27	Apollo Studio	Request access to Apollo Studio	manual_access_request	{}	6	2025-08-12 17:09:45.497496-03	2025-08-12 17:09:45.497496-03	To request access to the Audi NAR Apollo Studio organization, submit a request through Platform Ops & Engineering Service Desk:\nGo to Platform Ops & Engineering Service Desk > Requests > Cloud Request\nEnvironments: Prod & QA\nDescription: Add the following information:\nName of individual requiring access\nEmail Address of individual requiring access\nApollo Studio Organization: US Instance\nUser Role Requested: Contributor\nReason for access request\nCloud Apps: Audi Digital Access 
28	GCP	Request access to Google Cloud Platform	manual_access_request	{}	6	2025-08-12 17:10:39.649905-03	2025-08-12 17:10:39.649905-03	Please use POET Service Desk to request access to GCP:\nGo to Platform Ops & Engineering Service Desk > Requests > Cloud Request\nEnvironments: Prod, Non Prod\nDescription: (Included which products the new team member needs access to)\nCloud Apps: Audi Digital Products 
36	myAudi R and P		automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_23625": {"type": "dynamic", "value": "name"}, "customfield_25506": {"type": "dynamic", "value": "audi_email"}, "customfield_31501": {"type": "dynamic", "value": "Contact_Person"}, "customfield_34047": {"type": "static", "value": "CI&T"}, "customfield_35300": {"type": "dynamic", "value": "Surname"}, "customfield_51900": {"type": "static", "value": "NAR Prod Support team requires access to troubleshoot/reproduce issues"}, "customfield_51902": {"type": "static", "value": ["71702", "71703"]}}, "requestTypeId": "1297", "serviceDeskId": "61"}}	6	2025-08-12 17:21:24.229086-03	2025-08-13 13:22:49.793768-03	
30	App Store	Request access to oneAudi's App Store	automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_12201": {"type": "static", "value": "https://app-store.one.audi/"}, "customfield_22504": {"type": "dynamic", "value": "audi_email"}}, "requestTypeId": "780", "serviceDeskId": "45"}}	6	2025-08-12 17:12:53.75303-03	2025-08-13 13:21:48.794852-03	
31	GitHub oneAudi		automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_23625": {"type": "dynamic", "value": "name"}, "customfield_23626": {"type": "dynamic", "value": "email"}, "customfield_30707": {"type": "static", "value": ["54520"]}, "customfield_34044": {"type": "dynamic", "value": "Team_Name"}, "customfield_34512": {"type": "dynamic", "value": "CIANDT_GitHub_Username"}, "customfield_35300": {"type": "dynamic", "value": "Surname"}, "customfield_35301": {"type": "static", "value": "54100"}}, "requestTypeId": "941", "serviceDeskId": "43"}}	6	2025-08-12 17:15:11.095072-03	2025-08-13 13:22:34.395903-03	
37	WEBSUPPORT Jira Project	Request access to WEBSUPPORT Jira Project	automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_12201": {"type": "static", "value": "https://collaboration.msi.audi.com/jira/projects/WEBSUPPORT/"}, "customfield_22504": {"type": "dynamic", "value": "audi_email"}}, "requestTypeId": "780", "serviceDeskId": "45"}}	6	2025-08-13 14:40:14.547967-03	2025-08-13 14:40:14.547967-03	
50	NAROWN Jira Project	Request access to NAROWN Jira Project	automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_12201": {"type": "static", "value": "https://collaboration.msi.audi.com/jira/projects/NAROWN/"}, "customfield_22504": {"type": "dynamic", "value": "audi_email"}}, "requestTypeId": "780", "serviceDeskId": "45"}}	6	2025-08-13 15:34:48.934385-03	2025-08-13 15:36:07.11848-03	
33	AWS		automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_23625": {"type": "dynamic", "value": "name"}, "customfield_23626": {"type": "dynamic", "value": "audi_email"}, "customfield_31501": {"type": "dynamic", "value": "Contact_Person"}, "customfield_34044": {"type": "dynamic", "value": "Team_Name"}, "customfield_35300": {"type": "dynamic", "value": "Surname"}, "customfield_35302": {"type": "dynamic", "value": "ART"}, "customfield_35303": {"type": "dynamic", "value": "KUMS_ID"}, "customfield_62400": {"type": "static", "value": ["83808", "83807", "83804", "83803", "83802", "83801"]}, "customfield_62501": {"type": "static", "value": "83903"}}, "requestTypeId": "1005", "serviceDeskId": "43"}}	6	2025-08-12 17:17:19.466-03	2025-08-13 17:09:47.34411-03	
64	SalesForce QA CAN		manual_access_request	{}	6	2025-08-13 17:17:22.280723-03	2025-08-13 17:17:22.280723-03	myserve request
57	Enablement Jira Project	Request Access to the Enablement Jira Project	manual_access_request	{}	6	2025-08-13 16:52:20.702876-03	2025-08-13 16:53:33.299213-03	My.serve request
54	OneAudi Confluence Space	Request access to OneAudi Confluence Space	automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_12201": {"type": "static", "value": "https://collaboration.msi.audi.com/confluence/spaces/ONEAUDI/pages/188671880/oneAudi+Solution"}, "customfield_22504": {"type": "dynamic", "value": "audi_email"}}, "requestTypeId": "780", "serviceDeskId": "45"}}	6	2025-08-13 15:45:58.419997-03	2025-08-13 17:07:49.529258-03	
61	Battery Lookup Confluence Space	Request access to Battery Lookup Confluence Space	automated_access_request	{"jira": {"configKey": "MSI", "fieldMappings": {"customfield_12201": {"type": "static", "value": "https://collaboration.msi.audi.com/confluence/spaces/BATTERY/"}, "customfield_22504": {"type": "dynamic", "value": "audi_email"}}, "requestTypeId": "780", "serviceDeskId": "45"}}	6	2025-08-13 17:07:57.901595-03	2025-08-13 17:08:32.127098-03	
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: psampietri
--

COPY public.users (id, email, name, password_hash, role, created_at, updated_at, "Surname", "KUMS_ID", "ART", "Team_Name", "Contact_Person", "Vendor_ID", "CIANDT_GitHub_Username", start_date, location, team_role, audi_email) FROM stdin;
6	psampietri@ciandt.com	Pedro	$2b$10$S6AzHb7PLFWnYuJDstSRs.ci6bATDl.HDzI.LvJ86mhBPtkHeUTxu	admin	2025-08-13 13:25:48.850561-03	2025-08-13 14:05:41.976597-03	Sampietri	SFW3J7U	NAR	Production Support	Sundeep Banait	vndrsomops1	psampietri	03/18/2024	Campinas	Agile Lead	extern.PedroGabriel.BuenoSampietri@audi.com
15	gsantana@ciandt.com	Gabriel	$2b$10$HuNuGihm5r2U81GxYcg3Su5jQ7I0bKnSDyHIRxH6YbnN8tzHzW3de	user	2025-08-13 14:16:12.884051-03	2025-08-13 14:16:22.482956-03	Santana	GE1JH8D	NAR	Production Support	Sundeep Banait	GE1JH8D	gsaantana	03/10/2025	Belo Horizonte	Intern	extern.gabriel.santana1@audi.com
16	msoares@ciandt.com	Marcus	$2b$10$RDJBW/pIcJsp7CLML7PYZemh.Z.E9mbf/Nma.Z.k.I7sNHGB9nUPG	user	2025-08-13 14:22:31.606296-03	2025-08-13 14:22:31.606296-03	Aldrey	TCR8RO5	NAR	Production Support	Sundeep Banait	TCR8RO5	marcusaldrey	02/20/2025	Feira de Santana	Developer	extern.Marcus.Aldrey@audi.ca
17	mhernandez@ciandt.com	Martin	$2b$10$nTEsAE7YaBU23AafKglad.M.daYe3PwUODmpbnR1SZcvhrxPiV0p6	user	2025-08-13 14:25:49.956976-03	2025-08-13 14:29:10.298492-03	Hernandez	DHTF21S	NAR	Production Support	Sundeep Banait	DHTF21S	martin-ciandt	03/12/2025	Manila	Developer	extern.Martin.Hernandez@audi.ca
18	miguel.zapata@ciandt.com	Miguel	$2b$10$eElkJk5t1YCFI69RZh3E7unQUZjA/GYnfBKnh.a.ZvPb22suxHvw6	user	2025-08-13 14:31:04.3775-03	2025-08-13 14:31:04.3775-03	Zapata	UQY0CED	NAR	Production Support	Sundeep Banait	UQY0CED	miguelzapataj	04/21/2025	Medellin	Developer	extern.miguel.zapata@audi.com
19	kcabral@ciandt.com	Kelton	$2b$10$a9mLpHuUFdUElvp62gWo3ujNRQ610D3g7q0tosAiR5bNyEEjzvFIK	user	2025-08-13 14:32:37.274333-03	2025-08-13 14:32:37.274333-03	Cabral	U14S5WV	NAR	Production Support	Sundeep Banait	U14S5WV	kelton-c	02/24/2025	Lisboa	Developer	extern.Kelton.Cabral@audi.ca
20	laresso@ciandt.com	Laresso	$2b$10$LueSC/3NIdla0ANpO.MTr.3Cppgx6bvgCV0lmtyybPgg8hnWr0a5W	admin	2025-08-13 14:35:14.029632-03	2025-08-13 14:35:14.029632-03	Assis	DVUVMNV	NAR	Production Support	Sundeep Banait	DVUVMNV	LaaAssis	07/01/2024	Guimarães	Developer Lead	extern.laresso.assis@audi.com
21	carol.nino@ciandt.com	Carol	$2b$10$keruKFrmItozhzqJ19RAieGJsWPGidGVDMWXEzlH4ISqlvi3h/3Yi	admin	2025-08-13 14:37:37.348451-03	2025-08-13 14:37:37.348451-03	Niño	DVUDDU6	NAR	Production Support	Sundeep Banait	vndrsomocn	carolciandt	11/15/2022	Medellin	QA	extern.Carol.Nino@audi.com
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psampietri
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: email_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psampietri
--

SELECT pg_catalog.setval('public.email_templates_id_seq', 1, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psampietri
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: onboarding_instances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psampietri
--

SELECT pg_catalog.setval('public.onboarding_instances_id_seq', 4, true);


--
-- Name: onboarding_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psampietri
--

SELECT pg_catalog.setval('public.onboarding_templates_id_seq', 6, true);


--
-- Name: task_instances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psampietri
--

SELECT pg_catalog.setval('public.task_instances_id_seq', 74, true);


--
-- Name: task_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psampietri
--

SELECT pg_catalog.setval('public.task_templates_id_seq', 64, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psampietri
--

SELECT pg_catalog.setval('public.users_id_seq', 21, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: onboarding_instances onboarding_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_instances
    ADD CONSTRAINT onboarding_instances_pkey PRIMARY KEY (id);


--
-- Name: onboarding_template_tasks onboarding_template_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_template_tasks
    ADD CONSTRAINT onboarding_template_tasks_pkey PRIMARY KEY (onboarding_template_id, task_template_id);


--
-- Name: onboarding_templates onboarding_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_templates
    ADD CONSTRAINT onboarding_templates_pkey PRIMARY KEY (id);


--
-- Name: task_instances task_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.task_instances
    ADD CONSTRAINT task_instances_pkey PRIMARY KEY (id);


--
-- Name: task_template_dependencies task_template_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.task_template_dependencies
    ADD CONSTRAINT task_template_dependencies_pkey PRIMARY KEY (task_template_id, depends_on_id);


--
-- Name: task_templates task_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: email_templates email_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: onboarding_instances onboarding_instances_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_instances
    ADD CONSTRAINT onboarding_instances_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: onboarding_instances onboarding_instances_onboarding_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_instances
    ADD CONSTRAINT onboarding_instances_onboarding_template_id_fkey FOREIGN KEY (onboarding_template_id) REFERENCES public.onboarding_templates(id);


--
-- Name: onboarding_instances onboarding_instances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_instances
    ADD CONSTRAINT onboarding_instances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: onboarding_template_tasks onboarding_template_tasks_onboarding_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_template_tasks
    ADD CONSTRAINT onboarding_template_tasks_onboarding_template_id_fkey FOREIGN KEY (onboarding_template_id) REFERENCES public.onboarding_templates(id) ON DELETE CASCADE;


--
-- Name: onboarding_template_tasks onboarding_template_tasks_task_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_template_tasks
    ADD CONSTRAINT onboarding_template_tasks_task_template_id_fkey FOREIGN KEY (task_template_id) REFERENCES public.task_templates(id) ON DELETE CASCADE;


--
-- Name: onboarding_templates onboarding_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.onboarding_templates
    ADD CONSTRAINT onboarding_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: task_instances task_instances_onboarding_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.task_instances
    ADD CONSTRAINT task_instances_onboarding_instance_id_fkey FOREIGN KEY (onboarding_instance_id) REFERENCES public.onboarding_instances(id) ON DELETE CASCADE;


--
-- Name: task_instances task_instances_task_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.task_instances
    ADD CONSTRAINT task_instances_task_template_id_fkey FOREIGN KEY (task_template_id) REFERENCES public.task_templates(id) ON DELETE CASCADE;


--
-- Name: task_template_dependencies task_template_dependencies_depends_on_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.task_template_dependencies
    ADD CONSTRAINT task_template_dependencies_depends_on_id_fkey FOREIGN KEY (depends_on_id) REFERENCES public.task_templates(id) ON DELETE CASCADE;


--
-- Name: task_template_dependencies task_template_dependencies_task_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.task_template_dependencies
    ADD CONSTRAINT task_template_dependencies_task_template_id_fkey FOREIGN KEY (task_template_id) REFERENCES public.task_templates(id) ON DELETE CASCADE;


--
-- Name: task_templates task_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psampietri
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

