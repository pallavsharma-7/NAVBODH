const bcrypt = require('bcryptjs');
const { initDatabase, getDb } = require('./db');

function seedDatabase() {
  const db = initDatabase();

  console.log('[Seed] Starting NAVBODH database seeding...');

  // Use a transaction for fast and safe seeding
  const seedTransaction = db.transaction(() => {
    // 1. Departments
    const insertDept = db.prepare(`
      INSERT OR IGNORE INTO departments (code, name, description)
      VALUES (?, ?, ?)
    `);

    const departments = [
      ['NAD', 'National Accounts Division', 'Responsible for compilation of National Income, GDP, Capital Formation and Input-Output Tables.'],
      ['SDRD', 'Survey Design & Research Division', 'Handles design of multi-subject socio-economic surveys and statistical methodology.'],
      ['FOD', 'Field Operations Division', 'Manages countrywide field network for data collection across urban and rural sectors.'],
      ['ESD', 'Economic Statistics Division', 'Compiles Index of Industrial Production (IIP), Energy Statistics and Environmental Accounts.'],
      ['DIID', 'Data Informatics & Innovation Division', 'Drives digital transformation, IT infrastructure, data dissemination and AI initiatives.'],
      ['NSSTA', 'National Statistical Systems Training Academy', 'Premier human resource development academy for official statistical personnel.']
    ];

    for (const dept of departments) {
      insertDept.run(dept[0], dept[1], dept[2]);
    }
    console.log('[Seed] Departments seeded.');

    // Fetch department IDs
    const deptRows = db.prepare('SELECT id, code FROM departments').all();
    const deptMap = {};
    for (const row of deptRows) {
      deptMap[row.code] = row.id;
    }

    // 2. Users (Fictional demo data only)
    const saltRounds = 10;
    const empHash = bcrypt.hashSync('Password123!', saltRounds);
    const adminHash = bcrypt.hashSync('AdminPass123!', saltRounds);

    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role, full_name, designation, department_id, cadre, phone, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const users = [
      [
        'emp.sharma',
        'priya.sharma@demo.navbodh.gov.in',
        empHash,
        'employee',
        'Priya Sharma',
        'Statistical Officer',
        deptMap['NAD'],
        'Subordinate Statistical Service (SSS)',
        '+91-98110-00101',
        'Officer in National Accounts Division with expertise in industrial output compilation and macroeconomic data systems.'
      ],
      [
        'emp.verma',
        'rajesh.verma@demo.navbodh.gov.in',
        empHash,
        'employee',
        'Rajesh Verma',
        'Assistant Director',
        deptMap['SDRD'],
        'Indian Statistical Service (ISS)',
        '+91-98110-00102',
        'Assistant Director handling survey sampling frameworks, household surveys, and stratified random sampling methodologies.'
      ],
      [
        'admin.navbodh',
        'admin.director@demo.navbodh.gov.in',
        adminHash,
        'admin',
        'Dr. Anil Kumar',
        'Training Director / System Administrator',
        deptMap['NSSTA'],
        'Senior Administrative Grade (SAG)',
        '+91-98110-00100',
        'Administrator overseeing system configuration, competency benchmarking, and human capital analytics across official statistical wings.'
      ]
    ];

    for (const u of users) {
      insertUser.run(u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8], u[9]);
    }
    console.log('[Seed] Users seeded (2 employees, 1 admin).');

    // 3. Competencies across 4 Domains
    const insertComp = db.prepare(`
      INSERT OR IGNORE INTO competencies (code, name, domain, description, target_score)
      VALUES (?, ?, ?, ?, ?)
    `);

    const competencies = [
      // Statistical Domain
      ['STAT_SURVEY_DESIGN', 'Survey Design', 'Statistical', 'Design of socio-economic surveys, questionnaires, sampling frames, and fieldwork protocols.', 85.0],
      ['STAT_SAMPLING', 'Sampling', 'Statistical', 'Application of probability sampling methods, stratification, clustering, and estimation of variance.', 80.0],
      ['STAT_NAT_ACCOUNTS', 'National Accounts', 'Statistical', 'Methodology for GDP estimation, Gross Value Added (GVA), Supply-Use Tables, and System of National Accounts (SNA).', 85.0],
      ['STAT_SDG_INDICATORS', 'SDG Indicators', 'Statistical', 'Monitoring, metadata computation, and disaggregated reporting for UN Sustainable Development Goals.', 75.0],
      ['STAT_DATA_QUALITY', 'Data Quality Frameworks', 'Statistical', 'Application of National Quality Assurance Frameworks (NQAF), validation rules, and error auditing.', 80.0],

      // Technical Domain
      ['TECH_PYTHON', 'Python', 'Technical', 'Automated data processing, pandas, numpy, and reproducible scripting for official statistics.', 75.0],
      ['TECH_SQL', 'SQL', 'Technical', 'Relational database querying, aggregations, window functions, and enterprise data extraction.', 80.0],
      ['TECH_DATA_VIZ', 'Data Visualization', 'Technical', 'Creation of analytical dashboards, charts, statistical maps, and thematic presentations.', 75.0],
      ['TECH_AI_ML', 'AI/ML', 'Technical', 'Predictive modeling, automated text coding of survey occupations/industries, and anomaly detection.', 70.0],
      ['TECH_APIS', 'APIs', 'Technical', 'REST APIs, automated data ingestion pipelines, and interoperable data exchange formats.', 70.0],

      // Digital Governance Domain
      ['GOV_CYBERSECURITY', 'Cybersecurity', 'Digital Governance', 'Information security standards, password hygiene, phishing mitigation, and threat handling in government IT.', 80.0],
      ['GOV_DATA_PRIVACY', 'Data Privacy', 'Digital Governance', 'Digital Personal Data Protection Act compliance, anonymization, and respondent confidentiality safeguards.', 85.0],
      ['GOV_CLOUD', 'Government Cloud', 'Digital Governance', 'Government cloud infrastructure (MeghRaj/NIC), secure storage, and microservices architecture.', 75.0],

      // Behavioural / Managerial Domain
      ['BEH_LEADERSHIP', 'Leadership', 'Behavioural / Managerial', 'Team leadership, strategic vision, change management, and institutional stewardship.', 80.0],
      ['BEH_COMMUNICATION', 'Communication', 'Behavioural / Managerial', 'Clear statistical dissemination, executive policy briefing, and cross-departmental coordination.', 80.0],
      ['BEH_PROJECT_MGMT', 'Project Management', 'Behavioural / Managerial', 'Milestone tracking, resource allocation, and field monitoring of large-scale statistical operations.', 80.0],
      ['BEH_ETHICS', 'Ethics', 'Behavioural / Managerial', 'Professional ethics, scientific objectivity, impartiality, and prevention of conflict of interest in data reporting.', 90.0]
    ];

    for (const comp of competencies) {
      insertComp.run(comp[0], comp[1], comp[2], comp[3], comp[4]);
    }
    console.log('[Seed] 17 Competencies seeded across 4 domains.');

    // Fetch competency IDs
    const compRows = db.prepare('SELECT id, code FROM competencies').all();
    const compMap = {};
    for (const row of compRows) {
      compMap[row.code] = row.id;
    }

    // 4. Initial Assessment
    const insertAssessment = db.prepare(`
      INSERT OR IGNORE INTO assessments (code, title, description, type, is_active, total_questions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertAssessment.run(
      'INIT_COMP_BASELINE_V1',
      'Initial Competency Baseline Assessment',
      'Comprehensive baseline assessment evaluating proficiency across Statistical, Technical, Digital Governance, and Managerial domains.',
      'initial_baseline',
      1,
      17
    );

    const assessmentRow = db.prepare('SELECT id FROM assessments WHERE code = ?').get('INIT_COMP_BASELINE_V1');
    const assessmentId = assessmentRow.id;

    // 5. Assessment Questions (1 question per competency)
    const insertQuestion = db.prepare(`
      INSERT OR IGNORE INTO assessment_questions (assessment_id, competency_id, question_text, options_json, correct_option_index, explanation, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const questions = [
      // STAT_SURVEY_DESIGN
      [
        assessmentId,
        compMap['STAT_SURVEY_DESIGN'],
        'In designing a nationwide socio-economic survey, what is the primary purpose of a pilot survey / pre-test?',
        JSON.stringify([
          'To compute the final national GDP figures beforehand',
          'To test questionnaire clarity, respondent burden, and field logistics prior to full-scale rollout',
          'To replace the need for stratified random sampling in rural sectors',
          'To publish preliminary statistical bulletins immediately'
        ]),
        1,
        'Pilot surveys test the feasibility of questionnaire design, operational logistics, and clarify questions before large-scale execution.',
        'intermediate'
      ],

      // STAT_SAMPLING
      [
        assessmentId,
        compMap['STAT_SAMPLING'],
        'When the target population is highly heterogeneous across geographic regions but homogeneous within sub-districts, which sampling technique minimizes sampling error most effectively?',
        JSON.stringify([
          'Simple Random Sampling without Replacement (SRSWOR)',
          'Convenience Sampling',
          'Stratified Random Sampling with proportional allocation',
          'Snowball Sampling'
        ]),
        2,
        'Stratified sampling groups heterogeneous populations into homogeneous strata, thereby reducing overall variance.',
        'intermediate'
      ],

      // STAT_NAT_ACCOUNTS
      [
        assessmentId,
        compMap['STAT_NAT_ACCOUNTS'],
        'Under the System of National Accounts (SNA), Gross Value Added (GVA) at basic prices is calculated as:',
        JSON.stringify([
          'Gross Output at basic prices minus Intermediate Consumption',
          'GDP at market prices plus Total Indirect Taxes',
          'Net Domestic Product plus Depreciation and Net Foreign Remittances',
          'Total Household Final Consumption Expenditure only'
        ]),
        0,
        'GVA at basic prices = Gross Output at basic prices - Intermediate Consumption.',
        'advanced'
      ],

      // STAT_SDG_INDICATORS
      [
        assessmentId,
        compMap['STAT_SDG_INDICATORS'],
        'What is a primary requirement for Tier 1 SDG (Sustainable Development Goal) indicators according to the UN Statistical Commission?',
        JSON.stringify([
          'The indicator has no internationally established methodology yet',
          'The indicator is conceptually clear, has an established methodology, and data are regularly produced by countries',
          'The indicator is tracked exclusively through commercial private satellites',
          'The indicator requires no disaggregation by gender or geographical region'
        ]),
        1,
        'Tier 1 indicators are conceptually clear, have internationally established methodologies, and standards are widely available with regularly produced country data.',
        'intermediate'
      ],

      // STAT_DATA_QUALITY
      [
        assessmentId,
        compMap['STAT_DATA_QUALITY'],
        'Under the National Quality Assurance Framework (NQAF), which dimension assesses whether the data reflects the reality it was designed to measure without systematic bias?',
        JSON.stringify([
          'Timeliness',
          'Accuracy and Reliability',
          'Accessibility',
          'Punctuality'
        ]),
        1,
        'Accuracy and reliability evaluate the closeness of estimates to true population values and freedom from bias.',
        'intermediate'
      ],

      // TECH_PYTHON
      [
        assessmentId,
        compMap['TECH_PYTHON'],
        'In Python data analysis using pandas, which method is best suited for aggregating survey responses by District and calculating mean household expenditure?',
        JSON.stringify([
          'df.filter(items=["District"]).sum()',
          'df.groupby("District")["Household_Expenditure"].mean()',
          'df.sort_values(by="District").head()',
          'df.drop_duplicates(subset=["District"])'
        ]),
        1,
        'groupby() followed by an aggregation method like mean() computes summary statistics per category.',
        'intermediate'
      ],

      // TECH_SQL
      [
        assessmentId,
        compMap['TECH_SQL'],
        'Which SQL clause allows filtering grouped aggregate results (e.g., showing only districts where total survey count exceeds 500)?',
        JSON.stringify([
          'WHERE',
          'HAVING',
          'ORDER BY',
          'GROUP FILTER'
        ]),
        1,
        'The HAVING clause is used to filter aggregated data generated by GROUP BY.',
        'beginner'
      ],

      // TECH_DATA_VIZ
      [
        assessmentId,
        compMap['TECH_DATA_VIZ'],
        'When visualizing district-wise poverty percentages across an entire state, which visualization format provides the most intuitive spatial comprehension?',
        JSON.stringify([
          'Choropleth map with standardized color gradient classes',
          'Multi-line trend line chart with 75 overlapping lines',
          '3D exploded pie chart with 30 slices',
          'Radar chart with arbitrary polygon angles'
        ]),
        0,
        'Choropleth maps shade administrative boundaries by statistical values, making spatial distributions immediately readable.',
        'intermediate'
      ],

      // TECH_AI_ML
      [
        assessmentId,
        compMap['TECH_AI_ML'],
        'In automated coding of verbatim occupation descriptions from field questionnaires into standard National Classification of Occupations (NCO) codes, which ML technique is standard?',
        JSON.stringify([
          'Natural Language Processing (NLP) text classification / semantic embeddings',
          'K-Means clustering on pixel values',
          'Linear regression forecasting on time index',
          'Genetic algorithms for hardware scheduling'
        ]),
        0,
        'NLP text classifiers and embedding models map raw text descriptions to hierarchical standardized taxonomy codes.',
        'advanced'
      ],

      // TECH_APIS
      [
        assessmentId,
        compMap['TECH_APIS'],
        'Which HTTP method and status code combination represents the successful idempotent retrieval of a statistical indicator dataset via a REST API?',
        JSON.stringify([
          'POST with status 201 Created',
          'GET with status 200 OK',
          'PATCH with status 304 Not Modified',
          'DELETE with status 204 No Content'
        ]),
        1,
        'GET method is standard for data retrieval and returns HTTP 200 OK with the response payload.',
        'beginner'
      ],

      // GOV_CYBERSECURITY
      [
        assessmentId,
        compMap['GOV_CYBERSECURITY'],
        'What is the recommended protocol when an official receives an unsolicited email containing an unexpected attachment titled "Updated_Census_Table.exe"?',
        JSON.stringify([
          'Open the executable immediately to verify if survey figures are updated',
          'Forward the attachment to all department colleagues for second opinions',
          'Do not execute the file; report the suspicious phishing attempt to the departmental CISO/IT security officer',
          'Rename the file extension to .xlsx and upload to cloud drive'
        ]),
        2,
        'Suspicious executables should never be opened and must be reported immediately to IT security to prevent malware compromise.',
        'beginner'
      ],

      // GOV_DATA_PRIVACY
      [
        assessmentId,
        compMap['GOV_DATA_PRIVACY'],
        'Under India’s Digital Personal Data Protection (DPDP) Act and official statistical standards, what is required before publishing microdata containing individual respondent records?',
        JSON.stringify([
          'No special precautions are necessary if data is stored in government servers',
          'Anonymization and de-identification to prevent direct or indirect identification of individual data principals',
          'Publishing phone numbers so researchers can verify responses directly',
          'Selling microdata to commercial advertisers to fund surveys'
        ]),
        1,
        'Statistical microdata must be rigorously anonymized (removing direct and quasi-identifiers) to safeguard respondent confidentiality.',
        'intermediate'
      ],

      // GOV_CLOUD
      [
        assessmentId,
        compMap['GOV_CLOUD'],
        'What is a primary advantage of leveraging the Government of India MeghRaj Cloud infrastructure for national statistical portals?',
        JSON.stringify([
          'Complete elimination of need for data backup or disaster recovery planning',
          'Scalable computing resources, high availability, and compliance with MeitY security guidelines',
          'Exemption from all government procurement audits',
          'Allowing open unauthenticated public read/write access to internal databases'
        ]),
        1,
        'MeghRaj cloud offers secure, elastic computing infrastructure compliant with government standards and guidelines.',
        'intermediate'
      ],

      // BEH_LEADERSHIP
      [
        assessmentId,
        compMap['BEH_LEADERSHIP'],
        'When leading a cross-functional survey team facing tight deadlines and unexpected field impediments, which leadership approach yields the most sustainable performance?',
        JSON.stringify([
          'Autocratic micromanagement and punitive reporting for minor deviations',
          'Clear objective alignment, proactive bottleneck resolution, active listening, and empathetic team empowerment',
          'Ignoring field roadblocks and insisting on identical original timelines without support',
          'Delegating all responsibilities entirely without providing guidance or oversight'
        ]),
        1,
        'Effective public sector leadership aligns strategic goals while proactively removing roadblocks and supporting field personnel.',
        'intermediate'
      ],

      // BEH_COMMUNICATION
      [
        assessmentId,
        compMap['BEH_COMMUNICATION'],
        'When presenting complex statistical findings (such as revised CPI inflation figures) to non-technical policy stakeholders, what is the best practice?',
        JSON.stringify([
          'Deliver only raw 500-page formula appendices without executive summaries',
          'Use clear key takeaways, contextual visualizations, plain language explanations of caveats, and actionable policy implications',
          'Avoid mentioning any statistical confidence intervals or data sources',
          'Use dense mathematical jargon to make the report look sophisticated'
        ]),
        1,
        'Statistical communication must translate technical rigor into clear, actionable, and transparent insights for decision-makers.',
        'intermediate'
      ],

      // BEH_PROJECT_MGMT
      [
        assessmentId,
        compMap['BEH_PROJECT_MGMT'],
        'In managing a multi-phase national statistical operation, what does the "Critical Path" in project scheduling represent?',
        JSON.stringify([
          'The sequence of dependent tasks that determines the shortest possible time to complete the entire project',
          'The list of non-essential activities that can be postponed indefinitely without review',
          'The budgetary allocation reserved strictly for emergency travel',
          'The physical route taken by field enumerators between rural sample blocks'
        ]),
        0,
        'The Critical Path Method (CPM) identifies the sequence of dependent tasks directly determining project duration.',
        'intermediate'
      ],

      // BEH_ETHICS
      [
        assessmentId,
        compMap['BEH_ETHICS'],
        'Under the UN Fundamental Principles of Official Statistics and national standards, what must official statisticians do if external stakeholders pressure them to alter survey results?',
        JSON.stringify([
          'Modify the estimates to satisfy stakeholder preferences without documentation',
          'Uphold scientific objectivity, transparency, and statistical integrity by refusing political interference in data computation',
          'Destroy all original survey questionnaires to avoid controversy',
          'Delay publishing the survey indefinitely without explanation'
        ]),
        1,
        'Statisticians are duty-bound to maintain impartiality, scientific independence, and objective integrity in all official data.',
        'intermediate'
      ]
    ];

    for (const q of questions) {
      insertQuestion.run(q[0], q[1], q[2], q[3], q[4], q[5], q[6]);
    }
    console.log('[Seed] 17 Assessment Questions seeded.');

    // 6. Sample Courses (explicit source labels: sample_igot, sample_nssta_tpac, local_demo)
    const insertCourse = db.prepare(`
      INSERT OR IGNORE INTO courses (code, title, description, source_label, duration_hours, difficulty_level, domain)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const courses = [
      [
        'CRS_STAT_101',
        'Modern Survey Sampling & Estimation Techniques',
        'Comprehensive foundation in probability sampling, design effects, post-stratification, and variance estimation in official surveys.',
        'sample_nssta_tpac',
        16.0,
        'intermediate',
        'Statistical'
      ],
      [
        'CRS_STAT_201',
        'System of National Accounts & GDP Compilation',
        'Deep dive into the 2008 SNA framework, GVA by economic activity, sequence of accounts, and supply-use tables.',
        'sample_nssta_tpac',
        24.0,
        'advanced',
        'Statistical'
      ],
      [
        'CRS_TECH_101',
        'Python & Pandas for Official Statistical Workflows',
        'Practical hands-on training in automated data ingestion, validation rules, cleaning large microdata datasets, and export pipelines.',
        'sample_igot',
        20.0,
        'intermediate',
        'Technical'
      ],
      [
        'CRS_TECH_102',
        'SQL for Government Data Analysts',
        'Master relational querying, subqueries, CTEs, and window functions to query statistical data repositories directly.',
        'sample_igot',
        14.0,
        'beginner',
        'Technical'
      ],
      [
        'CRS_GOV_101',
        'Data Governance, Privacy & Security for Public Officials',
        'Understanding DPDP Act compliance, anonymization techniques, data classification, and security protocols in government statistical systems.',
        'sample_igot',
        10.0,
        'intermediate',
        'Digital Governance'
      ],
      [
        'CRS_MGT_101',
        'Public Sector Project Leadership & Dissemination',
        'Strategic leadership, stakeholder communication, team management, and ethical principles in official statistics dissemination.',
        'local_demo',
        12.0,
        'intermediate',
        'Behavioural / Managerial'
      ]
    ];

    for (const c of courses) {
      insertCourse.run(c[0], c[1], c[2], c[3], c[4], c[5], c[6]);
    }
    console.log('[Seed] Sample courses seeded with explicit source labels.');

    // Fetch course IDs
    const courseRows = db.prepare('SELECT id, code FROM courses').all();
    const courseMap = {};
    for (const row of courseRows) {
      courseMap[row.code] = row.id;
    }

    // 7. Course Competencies Mapping
    const insertCourseComp = db.prepare(`
      INSERT OR IGNORE INTO course_competencies (course_id, competency_id, growth_impact_score)
      VALUES (?, ?, ?)
    `);

    const courseCompMappings = [
      [courseMap['CRS_STAT_101'], compMap['STAT_SAMPLING'], 20.0],
      [courseMap['CRS_STAT_101'], compMap['STAT_SURVEY_DESIGN'], 15.0],
      [courseMap['CRS_STAT_201'], compMap['STAT_NAT_ACCOUNTS'], 25.0],
      [courseMap['CRS_STAT_201'], compMap['STAT_DATA_QUALITY'], 10.0],
      [courseMap['CRS_TECH_101'], compMap['TECH_PYTHON'], 25.0],
      [courseMap['CRS_TECH_101'], compMap['TECH_DATA_VIZ'], 10.0],
      [courseMap['CRS_TECH_102'], compMap['TECH_SQL'], 25.0],
      [courseMap['CRS_GOV_101'], compMap['GOV_DATA_PRIVACY'], 20.0],
      [courseMap['CRS_GOV_101'], compMap['GOV_CYBERSECURITY'], 15.0],
      [courseMap['CRS_MGT_101'], compMap['BEH_LEADERSHIP'], 15.0],
      [courseMap['CRS_MGT_101'], compMap['BEH_COMMUNICATION'], 15.0],
      [courseMap['CRS_MGT_101'], compMap['BEH_ETHICS'], 20.0]
    ];

    for (const m of courseCompMappings) {
      insertCourseComp.run(m[0], m[1], m[2]);
    }
    console.log('[Seed] Course-competency links created.');

    // 8. Sample Lessons
    const insertLesson = db.prepare(`
      INSERT OR IGNORE INTO lessons (course_id, title, sequence_order, content_summary, duration_minutes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const lessons = [
      [courseMap['CRS_STAT_101'], 'Principles of Probability Sampling & Frame Selection', 1, 'Covers sample frame construction and non-sampling errors.', 45],
      [courseMap['CRS_STAT_101'], 'Stratification & Multi-Stage Cluster Designs', 2, 'Methods for allocating sample units across rural/urban strata.', 60],
      [courseMap['CRS_STAT_201'], 'Overview of SNA 2008 Sequence of Accounts', 1, 'Production account, generation of income, and primary distribution.', 60],
      [courseMap['CRS_TECH_101'], 'Python Environment & Data Structures for Statistics', 1, 'Introduction to Python, Jupyter notebooks, and Pandas DataFrames.', 45],
      [courseMap['CRS_TECH_101'], 'Data Cleaning, Validation & Anomaly Detection', 2, 'Handling missing values, outlier detection, and data export.', 60],
      [courseMap['CRS_GOV_101'], 'DPDP Act Overview & Government Compliance Requirements', 1, 'Key provisions of DPDP Act for official statistical databases.', 40]
    ];

    for (const l of lessons) {
      insertLesson.run(l[0], l[1], l[2], l[3], l[4]);
    }
    console.log('[Seed] Sample lessons seeded.');

    // 9. Achievement Definitions (for Pallav / Gamification foundation)
    const insertAch = db.prepare(`
      INSERT OR IGNORE INTO achievement_definitions (code, title, description, icon, category, threshold_criteria_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const achievements = [
      ['ACH_FIRST_BASELINE', 'Baseline Established', 'Completed initial competency baseline assessment across all domains.', 'compass', 'milestone', JSON.stringify({ type: 'baseline_completed' })],
      ['ACH_STAT_PIONEER', 'Statistical Pioneer', 'Scored 80% or above in Statistical domain assessment.', 'chart-bar', 'domain', JSON.stringify({ domain: 'Statistical', score_threshold: 80 })],
      ['ACH_GROWTH_10PCT', 'Growth Momentum', 'Achieved 10% competency growth from initial baseline score.', 'trending-up', 'growth', JSON.stringify({ growth_percent: 10 })],
      ['ACH_DIGITAL_CHAMPION', 'Digital Governance Champion', 'Demonstrated top-tier mastery in government cyber and data privacy compliance.', 'shield', 'governance', JSON.stringify({ domain: 'Digital Governance', score_threshold: 80 })]
    ];

    for (const a of achievements) {
      insertAch.run(a[0], a[1], a[2], a[3], a[4], a[5]);
    }
    console.log('[Seed] Achievement definitions seeded.');

  });

  seedTransaction();
  console.log('[Seed] Database seeding completed successfully.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase
};
