-- ============================================================
-- AccessEvents — Full Database Setup
-- PostgreSQL via Supabase
-- ============================================================


-- ============================================================
-- PART 1: SCHEMA — DDL
-- Ran in this order to respect foreign key dependencies
-- ============================================================


-- ------------------------------------------------------------
-- BLOCK 1: Lookup / type tables
-- ------------------------------------------------------------

CREATE TABLE disability_type (
    disability_id   SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    category        VARCHAR(50)  NOT NULL,
    description     TEXT
);

CREATE TABLE event_category (
    category_id     SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    icon_code       VARCHAR(50)
);

CREATE TABLE notification_type (
    type_code       VARCHAR(50)  PRIMARY KEY,
    label           VARCHAR(100) NOT NULL,
    description     TEXT
);

CREATE TABLE recommendation_type (
    reason_code     VARCHAR(50)  PRIMARY KEY,
    description     TEXT         NOT NULL
);

CREATE TABLE report_status (
    status_code     VARCHAR(50)  PRIMARY KEY,
    label           VARCHAR(100) NOT NULL,
    description     TEXT
);

CREATE TABLE issue_type (
    issue_type      VARCHAR(50)  PRIMARY KEY,
    label           VARCHAR(100) NOT NULL,
    description     TEXT
);


-- ------------------------------------------------------------
-- BLOCK 2: Core independent tables
-- ------------------------------------------------------------

CREATE TABLE address (
    address_id      SERIAL PRIMARY KEY,
    address_line1   VARCHAR(255) NOT NULL,
    postcode        VARCHAR(20)  NOT NULL,
    city            VARCHAR(100) NOT NULL,
    country         VARCHAR(100) NOT NULL DEFAULT 'United Kingdom',
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6)
);

CREATE TABLE accessibility_feature (
    feature_id      SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    category        VARCHAR(50)  NOT NULL,
    icon_code       VARCHAR(50),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE app_user (
    user_id           SERIAL PRIMARY KEY,
    username          VARCHAR(50)  NOT NULL UNIQUE,
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    role              VARCHAR(20)  NOT NULL DEFAULT 'attendee'
                      CHECK (role IN ('attendee', 'organiser', 'admin')),
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    is_verified       BOOLEAN      NOT NULL DEFAULT FALSE,
    profile_photo_url VARCHAR(500)
);


-- ------------------------------------------------------------
-- BLOCK 3: Tables dependent on Block 2
-- ------------------------------------------------------------

CREATE TABLE venue (
    venue_id        SERIAL PRIMARY KEY,
    address_id      INT          NOT NULL REFERENCES address(address_id),
    name            VARCHAR(255) NOT NULL,
    capacity        INT          CHECK (capacity > 0),
    transport_info  TEXT,
    parking_info    TEXT
);

CREATE TABLE event (
    event_id        SERIAL PRIMARY KEY,
    organiser_id    INT          NOT NULL REFERENCES app_user(user_id),
    venue_id        INT          NOT NULL REFERENCES venue(venue_id),
    category_id     INT          NOT NULL REFERENCES event_category(category_id),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    start_time      TIMESTAMP    NOT NULL,
    end_time        TIMESTAMP    NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')),
    ticket_url      VARCHAR(500),
    is_free         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_event_times CHECK (end_time > start_time)
);

CREATE TABLE search_log (
    log_id          SERIAL PRIMARY KEY,
    user_id         INT          REFERENCES app_user(user_id) ON DELETE SET NULL,
    query_text      TEXT,
    results_count   INT          NOT NULL DEFAULT 0,
    searched_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- BLOCK 4: Junction and child tables
-- ------------------------------------------------------------

CREATE TABLE user_disability (
    user_id         INT          NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    disability_id   INT          NOT NULL REFERENCES disability_type(disability_id),
    is_primary      BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, disability_id)
);

CREATE TABLE user_preference (
    user_id         INT          NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    feature_id      INT          NOT NULL REFERENCES accessibility_feature(feature_id),
    priority_level  INT          NOT NULL DEFAULT 1
                    CHECK (priority_level BETWEEN 1 AND 5),
    PRIMARY KEY (user_id, feature_id)
);

CREATE TABLE feature_disability_relevance (
    feature_id      INT          NOT NULL REFERENCES accessibility_feature(feature_id),
    disability_id   INT          NOT NULL REFERENCES disability_type(disability_id),
    relevance_score INT          NOT NULL CHECK (relevance_score BETWEEN 1 AND 10),
    PRIMARY KEY (feature_id, disability_id)
);

CREATE TABLE venue_accessibility (
    venue_id        INT          NOT NULL REFERENCES venue(venue_id) ON DELETE CASCADE,
    feature_id      INT          NOT NULL REFERENCES accessibility_feature(feature_id),
    details         TEXT,
    is_confirmed    BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (venue_id, feature_id)
);

CREATE TABLE event_accessibility (
    event_id        INT          NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    feature_id      INT          NOT NULL REFERENCES accessibility_feature(feature_id),
    details         TEXT,
    is_confirmed    BOOLEAN      NOT NULL DEFAULT FALSE,
    evidence_url    VARCHAR(500),
    PRIMARY KEY (event_id, feature_id)
);

CREATE TABLE event_image (
    image_id        SERIAL PRIMARY KEY,
    event_id        INT          NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    url             VARCHAR(500) NOT NULL,
    alt_text        VARCHAR(255),
    is_primary      BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE review (
    review_id            SERIAL PRIMARY KEY,
    user_id              INT       NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    event_id             INT       NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    overall_rating       INT       NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    accessibility_rating INT       NOT NULL CHECK (accessibility_rating BETWEEN 1 AND 5),
    comment              TEXT,
    is_verified_attendee BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_event_review UNIQUE (user_id, event_id)
);

CREATE TABLE review_feature_rating (
    review_id       INT          NOT NULL REFERENCES review(review_id) ON DELETE CASCADE,
    feature_id      INT          NOT NULL REFERENCES accessibility_feature(feature_id),
    rating          INT          NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    PRIMARY KEY (review_id, feature_id)
);

CREATE TABLE saved_event (
    user_id         INT          NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    event_id        INT          NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    saved_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id)
);

CREATE TABLE recommendation (
    recommendation_id SERIAL      PRIMARY KEY,
    user_id           INT         NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    event_id          INT         NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    reason_code       VARCHAR(50) NOT NULL REFERENCES recommendation_type(reason_code),
    score             FLOAT       NOT NULL CHECK (score BETWEEN 0 AND 1),
    generated_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    was_clicked       BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE notification (
    notification_id SERIAL       PRIMARY KEY,
    user_id         INT          NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    event_id        INT          REFERENCES event(event_id) ON DELETE SET NULL,
    type_code       VARCHAR(50)  NOT NULL REFERENCES notification_type(type_code),
    message         TEXT         NOT NULL,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE accessibility_report (
    report_id       SERIAL PRIMARY KEY,
    user_id         INT          NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    event_id        INT          NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    feature_id      INT          NOT NULL REFERENCES accessibility_feature(feature_id),
    issue_type      VARCHAR(50)  NOT NULL REFERENCES issue_type(issue_type),
    description     TEXT         NOT NULL,
    status_code     VARCHAR(50)  NOT NULL DEFAULT 'open'
                    REFERENCES report_status(status_code),
    reported_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE search_filter (
    filter_id       SERIAL PRIMARY KEY,
    log_id          INT          NOT NULL REFERENCES search_log(log_id) ON DELETE CASCADE,
    filter_key      VARCHAR(50)  NOT NULL,
    filter_value    VARCHAR(255) NOT NULL
);


-- ------------------------------------------------------------
-- BLOCK 5: Indexes
-- ------------------------------------------------------------

CREATE INDEX idx_event_organiser     ON event(organiser_id);
CREATE INDEX idx_event_venue         ON event(venue_id);
CREATE INDEX idx_event_category      ON event(category_id);
CREATE INDEX idx_event_start_time    ON event(start_time);
CREATE INDEX idx_event_status        ON event(status);
CREATE INDEX idx_event_status_start  ON event(status, start_time);
CREATE INDEX idx_review_event        ON review(event_id);
CREATE INDEX idx_review_user         ON review(user_id);
CREATE INDEX idx_notification_user   ON notification(user_id);
CREATE INDEX idx_recommendation_user ON recommendation(user_id);
CREATE INDEX idx_search_log_user     ON search_log(user_id);
CREATE INDEX idx_venue_address       ON venue(address_id);


-- ============================================================
-- PART 2: SUPABASE AUTH TRIGGER
-- Automatically creates an app_user row when a user registers
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.app_user (username, email, password_hash, role, is_verified)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    'managed_by_supabase_auth',
    COALESCE(NEW.raw_user_meta_data->>'role', 'attendee'),
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- PART 3: ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE event                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE address                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_category          ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_accessibility     ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_feature   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_image             ENABLE ROW LEVEL SECURITY;
ALTER TABLE review                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user                ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_event             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_disability         ENABLE ROW LEVEL SECURITY;
ALTER TABLE disability_type         ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_accessibility     ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_report    ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_type              ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_type       ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_filter           ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_disability_relevance ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can view events"
  ON event FOR SELECT USING (true);

CREATE POLICY "Public can view venues"
  ON venue FOR SELECT USING (true);

CREATE POLICY "Public can view addresses"
  ON address FOR SELECT USING (true);

CREATE POLICY "Public can view categories"
  ON event_category FOR SELECT USING (true);

CREATE POLICY "Public can view event accessibility"
  ON event_accessibility FOR SELECT USING (true);

CREATE POLICY "Public can view features"
  ON accessibility_feature FOR SELECT USING (true);

CREATE POLICY "Public can view event images"
  ON event_image FOR SELECT USING (true);

CREATE POLICY "Public can view reviews"
  ON review FOR SELECT USING (true);

CREATE POLICY "Public can view users"
  ON app_user FOR SELECT USING (true);

CREATE POLICY "Public can view disability types"
  ON disability_type FOR SELECT USING (true);

CREATE POLICY "Public can view venue accessibility"
  ON venue_accessibility FOR SELECT USING (true);

CREATE POLICY "Public can view issue types"
  ON issue_type FOR SELECT USING (true);

CREATE POLICY "Public can view report statuses"
  ON report_status FOR SELECT USING (true);

CREATE POLICY "Public can view notification types"
  ON notification_type FOR SELECT USING (true);

CREATE POLICY "Public can view feature disability relevance"
  ON feature_disability_relevance FOR SELECT USING (true);

-- Saved events
CREATE POLICY "Users manage own saved events" ON saved_event
  FOR ALL USING (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can insert own saved events" ON saved_event
  FOR INSERT WITH CHECK (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can delete own saved events" ON saved_event
  FOR DELETE USING (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

-- User preferences
CREATE POLICY "Public can view user preferences"
  ON user_preference FOR SELECT USING (true);

CREATE POLICY "Users can insert own preferences" ON user_preference
  FOR INSERT WITH CHECK (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can delete own preferences" ON user_preference
  FOR DELETE USING (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

-- User disabilities
CREATE POLICY "Public can view user disabilities"
  ON user_disability FOR SELECT USING (true);

CREATE POLICY "Users can insert own disabilities" ON user_disability
  FOR INSERT WITH CHECK (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can delete own disabilities" ON user_disability
  FOR DELETE USING (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

-- Reviews
CREATE POLICY "Users can insert reviews" ON review
  FOR INSERT WITH CHECK (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

-- Accessibility reports
CREATE POLICY "Users can insert reports" ON accessibility_report
  FOR INSERT WITH CHECK (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can view own reports" ON accessibility_report
  FOR SELECT USING (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
    OR
    (SELECT role FROM app_user WHERE email = auth.jwt()->>'email') = 'admin'
  );

CREATE POLICY "Admins can update reports" ON accessibility_report
  FOR UPDATE USING (
    (SELECT role FROM app_user WHERE email = auth.jwt()->>'email') = 'admin'
  );

-- Notifications
CREATE POLICY "Users can view own notifications" ON notification
  FOR SELECT USING (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can update own notifications" ON notification
  FOR UPDATE USING (
    user_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Authenticated users can insert notifications" ON notification
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Events — organiser management
CREATE POLICY "Organisers can insert events" ON event
  FOR INSERT WITH CHECK (
    organiser_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Organisers can update own events" ON event
  FOR UPDATE USING (
    organiser_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Organisers can delete own events" ON event
  FOR DELETE USING (
    organiser_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
  );

-- Event accessibility — organiser management
CREATE POLICY "Organisers can insert event accessibility" ON event_accessibility
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT event_id FROM event
      WHERE organiser_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
    )
  );

CREATE POLICY "Organisers can delete event accessibility" ON event_accessibility
  FOR DELETE USING (
    event_id IN (
      SELECT event_id FROM event
      WHERE organiser_id = (SELECT user_id FROM app_user WHERE email = auth.jwt()->>'email')
    )
  );

-- Venues and addresses — authenticated users can insert
CREATE POLICY "Authenticated users can insert addresses" ON address
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert venues" ON venue
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert venue accessibility" ON venue_accessibility
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Search logs — anyone can insert, admins can view
CREATE POLICY "Anyone can insert search logs" ON search_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert search filters" ON search_filter
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view search logs" ON search_log
  FOR SELECT USING (
    (SELECT role FROM app_user WHERE email = auth.jwt()->>'email') = 'admin'
  );

CREATE POLICY "Admins can view search filters" ON search_filter
  FOR SELECT USING (
    (SELECT role FROM app_user WHERE email = auth.jwt()->>'email') = 'admin'
  );


-- ============================================================
-- PART 4: SAMPLE DATA — DML
-- ============================================================

-- Lookup tables
INSERT INTO disability_type (name, category, description) VALUES
('Deaf or hard of hearing',  'Sensory',       'Partial or total hearing loss affecting communication'),
('Blind or low vision',      'Sensory',       'Partial or total vision loss affecting sight'),
('Mobility impairment',      'Physical',      'Difficulty with movement, walking or motor control'),
('Autism spectrum',          'Cognitive',     'Neurodevelopmental condition affecting communication and sensory processing'),
('Chronic fatigue syndrome', 'Invisible',     'Persistent fatigue severely limiting daily activity'),
('Anxiety disorder',         'Mental Health', 'Condition causing excessive worry, fear or panic'),
('Dyslexia',                 'Cognitive',     'Learning difference affecting reading and writing'),
('Wheelchair user',          'Physical',      'Full-time or part-time wheelchair or mobility aid user');

INSERT INTO event_category (name, icon_code) VALUES
('Music & Concerts',       'music'),
('Arts & Theatre',         'theatre'),
('Sports & Fitness',       'sports'),
('Education & Talks',      'education'),
('Community & Social',     'community'),
('Food & Drink',           'food'),
('Film & Cinema',          'film'),
('Wellness & Mindfulness', 'wellness');

INSERT INTO notification_type (type_code, label, description) VALUES
('reminder',       'Event Reminder',       'Reminder sent before a saved or registered event'),
('update',         'Event Update',         'Notification of a change to event details'),
('cancellation',   'Event Cancellation',   'Notification that an event has been cancelled'),
('recommendation', 'New Recommendation',   'A new personalised event recommendation'),
('review_prompt',  'Leave a Review',       'Prompt sent after an event to encourage a review'),
('report_update',  'Report Status Update', 'Update on the status of an accessibility report');

INSERT INTO recommendation_type (reason_code, description) VALUES
('preference_match',   'Event matches user saved accessibility preferences'),
('disability_match',   'Event features are relevant to user declared disability types'),
('location_proximity', 'Event venue is within close proximity to user usual search location'),
('popular_accessible', 'Event is highly rated for accessibility by similar user profiles'),
('saved_similar',      'Event is similar to events the user has previously saved');

INSERT INTO report_status (status_code, label, description) VALUES
('open',         'Open',         'Report submitted and awaiting review'),
('under_review', 'Under Review', 'Report is being actively investigated'),
('resolved',     'Resolved',     'Report has been reviewed and resolved'),
('rejected',     'Rejected',     'Report was found to be inaccurate or invalid'),
('closed',       'Closed',       'Report closed with no further action required');

INSERT INTO issue_type (issue_type, label, description) VALUES
('inaccurate_feature', 'Inaccurate Feature',  'A listed accessibility feature does not exist or is incorrect'),
('missing_feature',    'Missing Feature',     'An accessibility feature present at the event is not listed'),
('poor_quality',       'Poor Quality',        'A feature was present but poorly implemented'),
('venue_mismatch',     'Venue Mismatch',      'Venue accessibility information does not match reality'),
('other',              'Other',               'Issue does not fall into any other category');

-- Addresses
INSERT INTO address (address_line1, postcode, city, country, latitude, longitude) VALUES
('Royal Festival Hall, Belvedere Road',  'SE1 8XX',  'London',     'United Kingdom',  51.505400, -0.116773),
('Birmingham Symphony Hall, Broad St',   'B1 2EA',   'Birmingham', 'United Kingdom',  52.477200, -1.910990),
('Manchester Central, Windmill St',      'M2 3GX',   'Manchester', 'United Kingdom',  53.476900, -2.246900),
('Edinburgh Playhouse, 18 Greenside Pl', 'EH1 3AA',  'Edinburgh',  'United Kingdom',  55.957800, -3.183200),
('Bristol Beacon, Canon Street',         'BS1 5UH',  'Bristol',    'United Kingdom',  51.454800, -2.597800),
('Leeds First Direct Arena, Arena Way',  'LS2 8BY',  'Leeds',      'United Kingdom',  53.797700, -1.546900),
('The O2, Peninsula Square',             'SE10 0DX', 'London',     'United Kingdom',  51.503200, -0.003100),
('Glasgow SEC Centre, Exhibition Way',   'G3 8YW',   'Glasgow',    'United Kingdom',  55.860900, -4.289600);

-- Accessibility features
INSERT INTO accessibility_feature (name, description, category, icon_code, is_active) VALUES
('BSL Interpretation',        'British Sign Language interpreter present throughout the event',         'Communication', 'bsl',           TRUE),
('Audio Description',         'Live or recorded audio description service available',                   'Sensory',       'audio_desc',    TRUE),
('Hearing Loop',              'Induction loop system installed for hearing aid users',                  'Sensory',       'loop',          TRUE),
('Step-Free Access',          'Full step-free access from entrance to all event areas',                 'Mobility',      'step_free',     TRUE),
('Accessible Toilets',        'Fully accessible toilet facilities on site',                             'Mobility',      'toilet',        TRUE),
('Wheelchair Spaces',         'Designated wheelchair spaces with companion seating',                    'Mobility',      'wheelchair',    TRUE),
('Quiet Room',                'Dedicated quiet room available for sensory breaks',                      'Sensory',       'quiet',         TRUE),
('Large Print Materials',     'Event programmes and materials available in large print',                'Visual',        'large_print',   TRUE),
('Braille Materials',         'Event programmes and materials available in Braille',                    'Visual',        'braille',       TRUE),
('Relaxed Performance',       'Adjusted performance with reduced noise, lighting and open movement',    'Sensory',       'relaxed',       TRUE),
('Assistance Dog Facilities', 'Water and relief areas provided for assistance dogs',                   'Mobility',      'assist_dog',    TRUE),
('Accessible Parking',        'Blue badge and accessible parking spaces available near the venue',      'Mobility',      'parking',       TRUE),
('Captioning',                'Live captioning or subtitles provided on screens',                       'Communication', 'caption',       TRUE),
('Low Sensory Environment',   'Event designed to minimise sensory overload with controlled stimuli',    'Sensory',       'low_sensory',   TRUE),
('Priority Seating',          'Reserved priority seating available near exits or accessible areas',     'Mobility',      'priority_seat', TRUE);

-- Users
INSERT INTO app_user (username, email, password_hash, role, is_verified) VALUES
('sarah_j',     'sarah.jones@email.com',          'hashed_pw_001', 'attendee',  TRUE),
('marcus_t',    'marcus.thompson@email.com',       'hashed_pw_002', 'attendee',  TRUE),
('priya_k',     'priya.kapoor@email.com',          'hashed_pw_003', 'attendee',  TRUE),
('liam_o',      'liam.obrien@email.com',           'hashed_pw_004', 'attendee',  TRUE),
('amira_h',     'amira.hassan@email.com',          'hashed_pw_005', 'attendee',  TRUE),
('david_w',     'david.walsh@email.com',           'hashed_pw_006', 'attendee',  FALSE),
('nina_c',      'nina.chen@email.com',             'hashed_pw_007', 'attendee',  TRUE),
('tom_b',       'tom.baker@email.com',             'hashed_pw_008', 'attendee',  TRUE),
('events_rfl',  'events@royalfestival.co.uk',      'hashed_pw_009', 'organiser', TRUE),
('bham_sym',    'info@birminghamsymphony.co.uk',   'hashed_pw_010', 'organiser', TRUE),
('mcr_central', 'events@manchestercentral.com',    'hashed_pw_011', 'organiser', TRUE),
('edin_play',   'bookings@edinburghplayhouse.com', 'hashed_pw_012', 'organiser', TRUE),
('bristol_bcn', 'hello@bristolbeacon.org',         'hashed_pw_013', 'organiser', TRUE),
('admin_user',  'admin@accessevents.co.uk',        'hashed_pw_014', 'admin',     TRUE);

-- Venues
INSERT INTO venue (address_id, name, capacity, transport_info, parking_info) VALUES
(1, 'Royal Festival Hall',       2900,  'Waterloo station 3 min walk. Bus routes 1, 4, 26, 76, 77, 381', 'No on-site parking. NCP at Upper Ground 5 min walk. Blue badge bays on Belvedere Road'),
(2, 'Birmingham Symphony Hall',  2262,  'New Street station 10 min walk. Tram stop at Centenary Square',  'NCP Broad Street adjacent. Blue badge spaces on Brindleyplace'),
(3, 'Manchester Central',        8000,  'Deansgate station 5 min walk. Metrolink at St Peters Square',    'Q-Park Great Northern nearby. Limited Blue badge on Windmill Street'),
(4, 'Edinburgh Playhouse',       3059,  'Waverley station 10 min walk. Multiple bus routes on Leith Walk', 'No on-site parking. NCP at St James Quarter nearby'),
(5, 'Bristol Beacon',            1800,  'Bristol Temple Meads 15 min walk. Bus routes 8, 9 nearby',       'Trenchard Street car park 3 min walk. Blue badge bays on Canon Street'),
(6, 'First Direct Arena Leeds',  13500, 'Leeds station 10 min walk. Bus routes 1, 6, 28 to Arena Way',    'Arla Foods Arena car park adjacent. Blue badge level 1 entrance'),
(7, 'The O2 Arena',              20000, 'North Greenwich station 1 min walk. Thames Clipper available',    'On-site parking available. Blue badge spaces at main entrance'),
(8, 'SEC Centre Glasgow',        10000, 'Exhibition Centre station adjacent. Anderston station 10 min',    'On-site parking P1 and P2. Blue badge spaces near main entrance');

-- Events
INSERT INTO event (organiser_id, venue_id, category_id, title, description, start_time, end_time, status, ticket_url, is_free) VALUES
(9,  1, 1, 'Relaxed Prom: A Night at the Orchestra',       'A relaxed performance of classic orchestral pieces with adjusted lighting and sound levels, quiet spaces and a welcoming atmosphere for all.',           '2026-05-10 19:00:00', '2026-05-10 21:30:00', 'upcoming', 'https://tickets.rfl.co.uk/prom001',    FALSE),
(9,  1, 2, 'BSL Interpreted Theatre: The Glass Menagerie', 'Tennessee Williams classic performed with a BSL interpreter on stage throughout. Captioning also provided on side screens.',                            '2026-05-18 19:30:00', '2026-05-18 22:00:00', 'upcoming', 'https://tickets.rfl.co.uk/theatre001', FALSE),
(10, 2, 1, 'Symphony in the City: Beethoven Evening',      'An evening of Beethoven symphonies performed by the City of Birmingham Symphony Orchestra. Hearing loop and large print programmes available.',          '2026-06-03 19:00:00', '2026-06-03 21:30:00', 'upcoming', 'https://cbso.co.uk/beethoven',         FALSE),
(11, 3, 4, 'Inclusive Tech Talks: AI for Everyone',        'A series of accessible talks on artificial intelligence. BSL interpretation, captioning and quiet room provided.',                                     '2026-05-25 10:00:00', '2026-05-25 16:00:00', 'upcoming', NULL,                                   TRUE),
(12, 4, 2, 'Audio Described Performance: Hamilton',        'The West End sensation with full audio description service and touch tours available pre-show.',                                                        '2026-06-14 19:30:00', '2026-06-14 22:30:00', 'upcoming', 'https://edinburghplayhouse.com/hamilton',FALSE),
(13, 5, 8, 'Mindfulness and Movement: Accessible Yoga',   'A gentle accessible yoga session designed for wheelchair users and those with limited mobility.',                                                       '2026-05-31 10:00:00', '2026-05-31 12:00:00', 'upcoming', NULL,                                   TRUE),
(10, 2, 5, 'Community Craft Morning',                     'A relaxed community crafting session suitable for adults with learning disabilities, autism and sensory sensitivities.',                                 '2026-06-07 10:30:00', '2026-06-07 13:00:00', 'upcoming', NULL,                                   TRUE),
(11, 3, 6, 'Accessible Food Festival',                    'A food and drink festival with full step-free access, accessible toilets, quiet zones and BSL-interpreted cookery demonstrations.',                      '2026-07-04 11:00:00', '2026-07-06 18:00:00', 'upcoming', 'https://mcr-food-fest.co.uk',          FALSE),
(9,  1, 7, 'Relaxed Cinema: Hidden Figures',              'Relaxed screening of Hidden Figures with subtitles, adjusted sound and lighting.',                                                                      '2026-05-22 14:00:00', '2026-05-22 16:30:00', 'upcoming', NULL,                                   TRUE),
(12, 4, 1, 'Folk Music Festival: Opening Night',          'Opening night of the Edinburgh Folk Festival with hearing loop, BSL interpretation and accessible viewing platforms.',                                   '2026-08-01 18:00:00', '2026-08-01 22:00:00', 'upcoming', 'https://edinfolkfest.co.uk/opening',   FALSE),
(13, 5, 3, 'Wheelchair Basketball Taster Session',        'Try wheelchair basketball in a friendly inclusive environment. All equipment provided.',                                                                '2026-06-21 13:00:00', '2026-06-21 15:30:00', 'upcoming', NULL,                                   TRUE),
(14, 6, 1, 'Inclusive Music Showcase',                    'Showcasing musicians with disabilities. Full accessibility suite including BSL, captioning, hearing loop, quiet room and step-free access throughout.',  '2026-07-12 17:00:00', '2026-07-12 21:00:00', 'upcoming', 'https://firstdirectarena.com/showcase', FALSE);

-- User disabilities
INSERT INTO user_disability (user_id, disability_id, is_primary) VALUES
(1, 1, TRUE),  (1, 6, FALSE),
(2, 8, TRUE),  (2, 3, FALSE),
(3, 2, TRUE),
(4, 4, TRUE),  (4, 6, FALSE),
(5, 1, TRUE),  (5, 7, FALSE),
(6, 5, TRUE),  (6, 6, FALSE),
(7, 3, TRUE),
(8, 2, TRUE),  (8, 1, FALSE),
(9, 3, TRUE),
(10, 1, TRUE),
(11, 4, TRUE), (11, 5, FALSE),
(12, 2, TRUE),
(13, 6, TRUE), (13, 5, FALSE),
(14, 7, TRUE);

-- User preferences
INSERT INTO user_preference (user_id, feature_id, priority_level) VALUES
(1, 1, 5),  (1, 3, 5),  (1, 13, 4), (1, 7, 3),  (1, 8, 2),
(2, 4, 5),  (2, 6, 5),  (2, 5, 4),  (2, 12, 4), (2, 11, 3), (2, 15, 2),
(3, 2, 5),  (3, 8, 5),  (3, 9, 4),  (3, 13, 3), (3, 15, 2),
(4, 7, 5),  (4, 10, 5), (4, 14, 5), (4, 15, 3), (4, 1, 2),
(5, 1, 5),  (5, 3, 5),  (5, 13, 4), (5, 8, 3),  (5, 9, 2),
(6, 7, 5),  (6, 15, 4), (6, 4, 3),  (6, 5, 3),  (6, 12, 2),
(7, 4, 5),  (7, 5, 5),  (7, 6, 4),  (7, 11, 4), (7, 12, 3), (7, 15, 2),
(8, 2, 5),  (8, 1, 5),  (8, 8, 4),  (8, 9, 4),  (8, 13, 3), (8, 3, 3),
(9, 4, 5),  (9, 6, 4),  (9, 5, 3),
(10, 1, 5), (10, 3, 4), (10, 13, 3),
(11, 7, 5), (11, 14, 5),(11, 10, 4),(11, 4, 3),
(12, 2, 5), (12, 8, 5), (12, 9, 4), (12, 13, 3),
(13, 7, 5), (13, 10, 4),(13, 14, 4),(13, 15, 3),(13, 4, 2),
(14, 8, 5), (14, 13, 4),(14, 1, 3);

-- Feature disability relevance
INSERT INTO feature_disability_relevance (feature_id, disability_id, relevance_score) VALUES
(1,  1, 10), (3,  1, 10), (13, 1, 9),
(4,  3, 10), (6,  3, 10), (5,  3, 9),  (12, 3, 8), (15, 3, 7), (11, 3, 7),
(2,  2, 10), (8,  2, 9),  (9,  2, 8),
(7,  4, 10), (10, 4, 10), (14, 4, 9),
(7,  6, 9),  (14, 6, 8),  (10, 6, 7),
(8,  7, 8),  (13, 7, 6),
(4,  8, 10), (6,  8, 10), (5,  8, 9),  (11, 8, 8),
(7,  5, 8),  (15, 5, 7);

-- Venue accessibility
INSERT INTO venue_accessibility (venue_id, feature_id, details, is_confirmed) VALUES
(1, 3,  'Hearing loop installed in main auditorium and foyer',              TRUE),
(1, 4,  'Full step-free access via main entrance and lifts to all levels',  TRUE),
(1, 5,  'Accessible toilets on all levels',                                 TRUE),
(1, 6,  'Wheelchair spaces available in stalls and circle',                 TRUE),
(1, 11, 'Assistance dog water station in main foyer',                       TRUE),
(1, 12, 'Blue badge parking bays on Belvedere Road',                        TRUE),
(2, 3,  'Hearing loop throughout the main auditorium',                      TRUE),
(2, 4,  'Step-free access from Broad Street entrance',                      TRUE),
(2, 5,  'Accessible toilets near main entrance and level 2',                TRUE),
(2, 6,  'Wheelchair spaces in stalls row A',                                TRUE),
(3, 4,  'Step-free access via main Windmill Street entrance',               TRUE),
(3, 5,  'Accessible toilets throughout the venue',                          TRUE),
(3, 6,  'Dedicated wheelchair spaces across all hall configurations',       TRUE),
(4, 4,  'Step-free access via side entrance on Greenside Place',            TRUE),
(4, 5,  'Accessible toilet facilities on ground floor',                     TRUE),
(4, 3,  'Hearing loop installed in main auditorium',                        TRUE),
(5, 4,  'Full step-free access throughout the building',                    TRUE),
(5, 5,  'Accessible toilets on ground and first floor',                     TRUE),
(5, 6,  'Wheelchair spaces with companion seating in main hall',            TRUE),
(6, 4,  'Step-free access from car park and main entrance',                 TRUE),
(6, 5,  'Accessible toilets on all levels',                                 TRUE),
(6, 6,  'Wheelchair spaces at floor level near stage',                      TRUE),
(6, 12, 'Dedicated blue badge parking spaces on level 1',                   TRUE);

-- Event accessibility
INSERT INTO event_accessibility (event_id, feature_id, details, is_confirmed, evidence_url) VALUES
(1, 1,  'BSL interpreter present for pre-show talk and Q&A',                TRUE, NULL),
(1, 3,  'Hearing loop active throughout performance',                        TRUE, NULL),
(1, 7,  'Quiet room available on level 2 throughout the evening',           TRUE, NULL),
(1, 10, 'Relaxed performance format: reduced volume, lights kept low',      TRUE, NULL),
(1, 6,  'Wheelchair spaces in rows A and B stalls',                         TRUE, NULL),
(2, 1,  'BSL interpreter on stage right throughout full performance',       TRUE, NULL),
(2, 13, 'Live captions displayed on screens either side of stage',          TRUE, NULL),
(2, 3,  'Hearing loop active in auditorium',                                 TRUE, NULL),
(2, 8,  'Large print programmes available at box office',                   TRUE, NULL),
(3, 3,  'Hearing loop active throughout performance',                        TRUE, NULL),
(3, 8,  'Large print programmes available on request',                      TRUE, NULL),
(3, 6,  'Wheelchair spaces in stalls row A with companion seats',           TRUE, NULL),
(4, 1,  'BSL interpreter throughout all talks',                              TRUE, NULL),
(4, 13, 'Live captioning on main screens',                                   TRUE, NULL),
(4, 7,  'Quiet room available throughout the day',                           TRUE, NULL),
(4, 4,  'Full step-free access to all talk rooms',                           TRUE, NULL),
(5, 2,  'Audio description service via radio receivers at box office',      TRUE, NULL),
(5, 8,  'Large print and Braille programmes available on request',          TRUE, NULL),
(5, 9,  'Braille programmes available, request at least 48 hours in advance',TRUE,NULL),
(5, 3,  'Hearing loop active in main auditorium',                            TRUE, NULL),
(6, 4,  'Full step-free access. Yoga mats and chairs provided',              TRUE, NULL),
(6, 6,  'Session fully adapted for wheelchair users',                        TRUE, NULL),
(6, 7,  'Low sensory environment maintained throughout',                     TRUE, NULL),
(7, 7,  'Dedicated quiet room available throughout session',                 TRUE, NULL),
(7, 10, 'Relaxed session format throughout',                                 TRUE, NULL),
(7, 14, 'Low sensory environment: no bright lights or loud music',          TRUE, NULL),
(7, 1,  'BSL interpreter available for welcome and instructions',           TRUE, NULL),
(8, 1,  'BSL-interpreted cookery demonstrations at 12pm and 3pm daily',    TRUE, NULL),
(8, 4,  'Full step-free access across festival site',                        TRUE, NULL),
(8, 5,  'Accessible toilets throughout festival site',                       TRUE, NULL),
(8, 7,  'Designated quiet zones away from main stage',                       TRUE, NULL),
(9, 10, 'Relaxed screening: lights kept low, sound reduced',                 TRUE, NULL),
(9, 13, 'Subtitles on throughout',                                           TRUE, NULL),
(9, 7,  'Quiet room available outside screen',                               TRUE, NULL),
(10, 1, 'BSL interpreter for headline acts',                                 TRUE, NULL),
(10, 3, 'Hearing loop at main stage and acoustic tent',                      TRUE, NULL),
(10, 6, 'Accessible viewing platform with companion spaces',                 TRUE, NULL),
(11, 4, 'Full step-free access throughout sports hall',                      TRUE, NULL),
(11, 6, 'Session designed for wheelchair users',                             TRUE, NULL),
(11, 11,'Assistance dog relief area outside main entrance',                  TRUE, NULL),
(12, 1, 'BSL interpreter on stage throughout',                               TRUE, NULL),
(12, 13,'Live captioning on screens',                                        TRUE, NULL),
(12, 3, 'Hearing loop active',                                               TRUE, NULL),
(12, 7, 'Quiet room available on level 2',                                   TRUE, NULL),
(12, 10,'Relaxed format for opening set',                                    TRUE, NULL);

-- Event images
INSERT INTO event_image (event_id, url, alt_text, is_primary) VALUES
(1,  'https://cdn.accessevents.co.uk/events/1/main.jpg',  'Orchestra performing on stage at Royal Festival Hall',                   TRUE),
(2,  'https://cdn.accessevents.co.uk/events/2/main.jpg',  'BSL interpreter on stage alongside actors during The Glass Menagerie',  TRUE),
(3,  'https://cdn.accessevents.co.uk/events/3/main.jpg',  'Full orchestra on stage at Birmingham Symphony Hall',                    TRUE),
(4,  'https://cdn.accessevents.co.uk/events/4/main.jpg',  'Speaker at podium with BSL interpreter and captioning screens visible', TRUE),
(5,  'https://cdn.accessevents.co.uk/events/5/main.jpg',  'Cast of Hamilton on stage at Edinburgh Playhouse',                      TRUE),
(6,  'https://cdn.accessevents.co.uk/events/6/main.jpg',  'Participants in wheelchair yoga session in bright accessible studio',    TRUE),
(7,  'https://cdn.accessevents.co.uk/events/7/main.jpg',  'Group of adults at craft tables in relaxed community setting',          TRUE),
(8,  'https://cdn.accessevents.co.uk/events/8/main.jpg',  'Busy accessible food festival with wide pathways and colourful stalls', TRUE),
(9,  'https://cdn.accessevents.co.uk/events/9/main.jpg',  'Audience watching Hidden Figures in a relaxed cinema setting',          TRUE),
(10, 'https://cdn.accessevents.co.uk/events/10/main.jpg', 'Folk musicians performing with accessible viewing platform',             TRUE),
(11, 'https://cdn.accessevents.co.uk/events/11/main.jpg', 'Wheelchair basketball players in action in an indoor sports hall',      TRUE),
(12, 'https://cdn.accessevents.co.uk/events/12/main.jpg', 'Musician performing on stage at First Direct Arena Leeds',              TRUE);

-- Reviews
INSERT INTO review (user_id, event_id, overall_rating, accessibility_rating, comment, is_verified_attendee) VALUES
(1,  1,  5, 5, 'Absolutely brilliant relaxed prom. The quiet room was a lifesaver and the BSL interpreter was excellent throughout.',                               TRUE),
(2,  1,  4, 4, 'Great event overall. Step-free access was seamless from entrance to seat. Would have liked more wheelchair spaces.',                                TRUE),
(3,  2,  5, 5, 'Audio description was superb. Staff were incredibly helpful and the touch tour beforehand was a wonderful addition.',                               TRUE),
(1,  2,  5, 5, 'The BSL interpreter was perfectly positioned and very skilled. Captioning on the side screens meant I never missed a word.',                       TRUE),
(4,  4,  5, 5, 'Best accessible event I have attended. Quiet room was well managed and BSL interpreter was excellent for all sessions.',                           TRUE),
(5,  4,  4, 4, 'Really well organised. Captioning was clear and the step-free access worked perfectly.',                                                            TRUE),
(2,  6,  5, 5, 'Perfect yoga session for wheelchair users. The instructor was experienced and the whole environment felt genuinely inclusive.',                     TRUE),
(7,  6,  4, 5, 'Incredibly welcoming and well adapted. Accessible toilets were clean and nearby. Will definitely return.',                                          TRUE),
(4,  7,  5, 5, 'The low sensory environment was exactly right. Quiet room was calm and well-staffed.',                                                              TRUE),
(6,  7,  4, 4, 'A lovely morning. Would benefit from slightly more seating options but the relaxed atmosphere was genuinely calming.',                              TRUE),
(1,  9,  5, 5, 'Relaxed cinema done right. Subtitles were clear, sound was comfortable and the quiet room outside was a great touch.',                             TRUE),
(3,  5,  5, 5, 'Touch tour before the show was outstanding. Audio description was clear and unobtrusive.',                                                          TRUE),
(8,  5,  4, 4, 'Good audio description service. Braille programme was ready on arrival which I really appreciated.',                                                TRUE),
(5,  10, 4, 4, 'Hearing loop was effective at the main stage. BSL interpreter was present for headline acts.',                                                      TRUE),
(2,  11, 5, 5, 'Brilliant taster session. The organisers clearly understood the needs of wheelchair users.',                                                         TRUE),
(1,  12, 5, 5, 'Outstanding accessibility provision. BSL interpreter, captioning, hearing loop and quiet room all working perfectly.',                              TRUE),
(4,  12, 4, 4, 'Relaxed format for the opening set was really appreciated. Quiet room was well signposted.',                                                        TRUE),
(6,  9,  3, 3, 'Relaxed screening was good but the quiet room was quite small and got crowded.',                                                                    TRUE),
(7,  8,  4, 4, 'Accessible food festival was well laid out with wide pathways. BSL demonstrations were a highlight.',                                               TRUE),
(3,  3,  4, 4, 'Hearing loop worked perfectly throughout. Large print programme was clear and well designed.',                                                      TRUE);

-- Review feature ratings
INSERT INTO review_feature_rating (review_id, feature_id, rating, comment) VALUES
(1,  1,  5, 'Interpreter was highly skilled and well positioned'),
(1,  7,  5, 'Quiet room was calm, well lit and had comfortable seating'),
(2,  4,  4, 'Step-free access was smooth throughout the venue'),
(2,  6,  3, 'Wheelchair spaces were adequate but limited in number'),
(3,  2,  5, 'Audio description was clear, well-paced and unobtrusive'),
(4,  1,  5, 'BSL interpreter was excellently positioned stage right'),
(4,  13, 5, 'Captions were accurate and easy to read on side screens'),
(5,  7,  5, 'Quiet room was well managed with a calm atmosphere'),
(5,  1,  5, 'Interpreter covered all sessions without a break'),
(6,  13, 4, 'Captioning was clear and kept pace with speakers well'),
(7,  6,  5, 'Session fully adapted for wheelchair users throughout'),
(8,  5,  5, 'Accessible toilets were clean, spacious and nearby'),
(9,  7,  5, 'Quiet room was perfectly calm and well supervised'),
(9,  10, 5, 'Relaxed format was well calibrated'),
(10, 7,  4, 'Quiet room could have been larger but atmosphere was good'),
(11, 13, 5, 'Subtitles were clear and well timed throughout'),
(12, 2,  5, 'Audio description was outstanding in clarity and timing'),
(13, 9,  4, 'Braille programme was ready on arrival as promised'),
(14, 3,  4, 'Hearing loop was effective throughout the main stage area'),
(15, 4,  5, 'Step-free access from entrance to court was seamless'),
(16, 1,  5, 'BSL interpreter was present and skilled for full event'),
(16, 7,  5, 'Quiet room was well signposted and peaceful'),
(17, 10, 4, 'Relaxed format for opening set was well executed'),
(18, 13, 3, 'Subtitles were clear but quiet room was too small'),
(19, 1,  4, 'BSL demonstrations were engaging and well positioned'),
(20, 3,  4, 'Hearing loop worked well throughout the auditorium');

-- Saved events
INSERT INTO saved_event (user_id, event_id, saved_at) VALUES
(1,  1,  '2026-04-01 09:15:00'), (1,  2,  '2026-04-01 09:18:00'), (1,  9,  '2026-04-03 14:22:00'),
(2,  1,  '2026-04-02 11:00:00'), (2,  6,  '2026-04-02 11:05:00'), (2,  11, '2026-04-05 16:30:00'),
(3,  2,  '2026-04-01 20:00:00'), (3,  5,  '2026-04-01 20:05:00'), (3,  3,  '2026-04-04 10:10:00'),
(4,  4,  '2026-04-03 08:45:00'), (4,  7,  '2026-04-03 08:50:00'), (4,  12, '2026-04-06 17:00:00'),
(5,  4,  '2026-04-02 19:30:00'), (5,  10, '2026-04-04 12:00:00'),
(6,  7,  '2026-04-05 10:00:00'), (6,  9,  '2026-04-05 10:05:00'),
(7,  6,  '2026-04-03 15:45:00'), (7,  8,  '2026-04-06 09:20:00'),
(8,  5,  '2026-04-02 13:00:00'), (8,  3,  '2026-04-04 18:15:00');

-- Recommendations
INSERT INTO recommendation (user_id, event_id, reason_code, score, was_clicked) VALUES
(1,  2,  'preference_match',   0.97, TRUE),
(1,  9,  'preference_match',   0.91, TRUE),
(1,  12, 'disability_match',   0.88, FALSE),
(2,  6,  'disability_match',   0.96, TRUE),
(2,  11, 'preference_match',   0.93, TRUE),
(2,  8,  'location_proximity', 0.78, FALSE),
(3,  5,  'preference_match',   0.98, TRUE),
(3,  3,  'popular_accessible', 0.85, TRUE),
(4,  7,  'disability_match',   0.97, TRUE),
(4,  4,  'preference_match',   0.94, TRUE),
(5,  10, 'preference_match',   0.89, TRUE),
(5,  12, 'disability_match',   0.86, FALSE),
(6,  7,  'disability_match',   0.92, TRUE),
(6,  9,  'saved_similar',      0.80, TRUE),
(7,  8,  'location_proximity', 0.75, TRUE),
(7,  11, 'disability_match',   0.90, FALSE),
(8,  5,  'preference_match',   0.95, TRUE),
(8,  3,  'popular_accessible', 0.83, TRUE);

-- Notifications
INSERT INTO notification (user_id, event_id, type_code, message, is_read) VALUES
(1,  1,  'reminder',       'Your saved event Relaxed Prom: A Night at the Orchestra is tomorrow at 7pm.',             TRUE),
(1,  2,  'reminder',       'BSL Interpreted Theatre: The Glass Menagerie is coming up on 18 May.',                    FALSE),
(2,  1,  'reminder',       'Relaxed Prom is tomorrow. Your wheelchair space is confirmed.',                            TRUE),
(3,  5,  'reminder',       'Audio Described Performance: Hamilton is in 3 days. Your touch tour is at 6:30pm.',       FALSE),
(4,  4,  'reminder',       'Inclusive Tech Talks starts tomorrow at 10am at Manchester Central.',                      TRUE),
(1,  1,  'review_prompt',  'You attended Relaxed Prom last night. How was the accessibility? Leave a review.',        TRUE),
(2,  6,  'review_prompt',  'Hope you enjoyed Mindfulness and Movement. Share your accessibility experience.',         TRUE),
(3,  2,  'recommendation', 'New recommendation: Audio Described Performance: Hamilton matches your preferences.',      FALSE),
(4,  7,  'recommendation', 'Community Craft Morning looks perfect for you based on your accessibility preferences.',   TRUE),
(5,  12, 'recommendation', 'Inclusive Music Showcase in Leeds matches your hearing accessibility preferences.',        FALSE),
(6,  4,  'update',         'Inclusive Tech Talks has added an additional quiet room on level 3.',                      TRUE),
(7,  8,  'update',         'Accessible Food Festival has extended BSL interpreted sessions.',                          FALSE),
(1,  9,  'reminder',       'Relaxed Cinema: Hidden Figures is this Saturday at 2pm.',                                 FALSE),
(2,  11, 'reminder',       'Wheelchair Basketball Taster Session is next Saturday at 1pm.',                           FALSE);

-- Accessibility reports
INSERT INTO accessibility_report (user_id, event_id, feature_id, issue_type, description, status_code) VALUES
(6, 9,  7,  'poor_quality',      'The quiet room listed was very small and became overcrowded.',                                      'resolved'),
(2, 3,  6,  'inaccurate_feature','The listing stated multiple wheelchair spaces but only two were available and one was obstructed.', 'under_review'),
(4, 7,  14, 'missing_feature',   'The event was listed as low sensory but music was playing in the foyer at normal volume.',         'open'),
(7, 8,  12, 'venue_mismatch',    'Accessible parking listed as available but spaces were blocked by festival infrastructure.',        'resolved'),
(8, 5,  9,  'poor_quality',      'Braille programme contained errors in the cast list section.',                                      'open'),
(1, 12, 7,  'missing_feature',   'Quiet room listed on level 2 but signage was absent and staff were unaware of its location.',      'under_review');

-- Search logs
INSERT INTO search_log (user_id, query_text, results_count) VALUES
(1,    'BSL interpreted theatre London',      8),
(1,    'relaxed performances near me',        5),
(2,    'wheelchair accessible sports events', 6),
(2,    'step free concerts Birmingham',       4),
(3,    'audio described theatre Edinburgh',   3),
(4,    'autism friendly events Manchester',   7),
(4,    'low sensory events near Manchester',  5),
(5,    'hearing loop folk music events',      4),
(6,    'quiet room events anxiety',           6),
(7,    'accessible food festivals',           5),
(8,    'braille programmes theatre',          3),
(NULL, 'free accessible events London',       9),
(1,    'relaxed cinema subtitles',            6),
(3,    'touch tour theatre UK',               4);

-- Search filters
INSERT INTO search_filter (log_id, filter_key, filter_value) VALUES
(1,  'feature',  'BSL Interpretation'),
(1,  'category', 'Arts & Theatre'),
(1,  'city',     'London'),
(2,  'feature',  'Relaxed Performance'),
(2,  'feature',  'Quiet Room'),
(3,  'feature',  'Wheelchair Spaces'),
(3,  'feature',  'Step-Free Access'),
(3,  'category', 'Sports & Fitness'),
(4,  'feature',  'Step-Free Access'),
(4,  'city',     'Birmingham'),
(5,  'feature',  'Audio Description'),
(5,  'city',     'Edinburgh'),
(6,  'feature',  'Quiet Room'),
(6,  'feature',  'Low Sensory Environment'),
(6,  'city',     'Manchester'),
(7,  'feature',  'Low Sensory Environment'),
(7,  'is_free',  'true'),
(8,  'feature',  'Hearing Loop'),
(8,  'category', 'Music & Concerts'),
(9,  'feature',  'Quiet Room'),
(9,  'feature',  'Priority Seating'),
(10, 'feature',  'Step-Free Access'),
(10, 'feature',  'BSL Interpretation'),
(11, 'feature',  'Braille Materials'),
(11, 'category', 'Arts & Theatre'),
(12, 'feature',  'Step-Free Access'),
(12, 'is_free',  'true'),
(12, 'city',     'London'),
(13, 'feature',  'Captioning'),
(13, 'feature',  'Relaxed Performance'),
(14, 'feature',  'Audio Description'),
(14, 'category', 'Arts & Theatre');
