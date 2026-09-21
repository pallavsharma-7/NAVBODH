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

    // 8. Sample Lessons (Complete Curriculum for All Courses)
    const insertLesson = db.prepare(`
      INSERT OR IGNORE INTO lessons (course_id, title, sequence_order, content_summary, duration_minutes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const lessons = [
      // CRS_STAT_101
      [courseMap['CRS_STAT_101'], 'Principles of Probability Sampling & Frame Selection', 1, 'Covers sample frame construction, auxiliary variables, and non-sampling error mitigation in nationwide official surveys.', 45],
      [courseMap['CRS_STAT_101'], 'Stratification & Multi-Stage Cluster Designs', 2, 'Methods for allocating sample units across rural/urban strata and designing primary sampling units (PSUs).', 60],
      [courseMap['CRS_STAT_101'], 'Variance Estimation & Design Effects (Deff)', 3, 'Computational methods for calculating sampling errors, design effects, and post-stratification weighting adjustments.', 45],

      // CRS_STAT_201
      [courseMap['CRS_STAT_201'], 'Overview of SNA 2008 Sequence of Accounts', 1, 'Production account, generation of income, and primary distribution of income across institutional sectors.', 60],
      [courseMap['CRS_STAT_201'], 'Gross Value Added (GVA) by Industry & Basic Prices', 2, 'Measuring gross output, intermediate consumption, and economic activity classification at basic prices.', 60],
      [courseMap['CRS_STAT_201'], 'Supply-Use Tables (SUT) & Input-Output Matrices', 3, 'Balancing supply at purchaser prices with intermediate and final uses for national commodity balance.', 75],

      // CRS_TECH_101
      [courseMap['CRS_TECH_101'], 'Python Environment & Data Structures for Statistics', 1, 'Setting up reproducible Jupyter workflows, Pandas DataFrames, Series manipulation, and data types.', 45],
      [courseMap['CRS_TECH_101'], 'Data Cleaning, Validation & Anomaly Detection', 2, 'Handling missing microdata values, outlier detection using IQR/Z-scores, and automated validation rules.', 60],
      [courseMap['CRS_TECH_101'], 'Automated Pipeline Scripting & Microdata Export', 3, 'Writing automated ETL transformation scripts, batch file processing, and standardized statistical output generation.', 50],

      // CRS_TECH_102
      [courseMap['CRS_TECH_102'], 'Relational Database Architecture & Query Fundamentals', 1, 'Core relational concepts, SELECT statements, WHERE filtering, and multi-table INNER and LEFT joins.', 40],
      [courseMap['CRS_TECH_102'], 'Aggregate Functions, Grouping & Having Clauses', 2, 'Computing district-wise summary statistics, multi-column grouping, and filtering aggregated results with HAVING.', 45],
      [courseMap['CRS_TECH_102'], 'Window Functions, CTEs & Complex Statistical Extractions', 3, 'Mastering OVER/PARTITION BY clauses, DENSE_RANK(), moving averages, and Common Table Expressions.', 60],

      // CRS_GOV_101
      [courseMap['CRS_GOV_101'], 'DPDP Act Overview & Government Compliance Requirements', 1, 'Key legal provisions of India Digital Personal Data Protection Act for official statistical databases.', 40],
      [courseMap['CRS_GOV_101'], 'Statistical Anonymization & De-Identification Techniques', 2, 'Applying k-anonymity, l-diversity, pseudonymization, and perturbation before public microdata release.', 45],
      [courseMap['CRS_GOV_101'], 'Government Information Security Hygiene & Threat Mitigation', 3, 'Cybersecurity best practices, phishing prevention, secure government cloud protocols, and incident reporting.', 35],

      // CRS_MGT_101
      [courseMap['CRS_MGT_101'], 'Strategic Team Leadership in Large-Scale Field Operations', 1, 'Managing cross-functional enumerator teams, field bottleneck resolution, and operational quality control.', 40],
      [courseMap['CRS_MGT_101'], 'Translating Statistical Insights for Policy Stakeholders', 2, 'Executive briefing techniques, plain language dissemination, and effective statistical communication.', 45],
      [courseMap['CRS_MGT_101'], 'Fundamental Principles of Official Statistics & Ethics', 3, 'Upholding scientific independence, professional ethics, impartiality, and public trust in official reporting.', 35]
    ];

    for (const l of lessons) {
      insertLesson.run(l[0], l[1], l[2], l[3], l[4]);
    }
    console.log('[Seed] 18 Sample lessons seeded across all 6 courses.');

    // Fetch lesson IDs
    const lessonRows = db.prepare('SELECT id, course_id, title FROM lessons').all();
    const lessonMap = {};
    for (const l of lessonRows) {
      lessonMap[`${l.course_id}_${l.title}`] = l.id;
    }

    // 8b. Sample Learning Materials
    const insertMaterial = db.prepare(`
      INSERT OR IGNORE INTO learning_materials (lesson_id, title, material_type, file_url_or_ref)
      VALUES (?, ?, ?, ?)
    `);

    const materials = [
      [lessonMap[`${courseMap['CRS_STAT_101']}_Principles of Probability Sampling & Frame Selection`], 'NSSTA Sampling Frame Manual (Vol. 1)', 'reference_manual', 'doc:nssta/manual_sampling_v1.pdf'],
      [lessonMap[`${courseMap['CRS_STAT_101']}_Principles of Probability Sampling & Frame Selection`], 'Standard Operating Procedure on Frame Validation', 'guideline', 'doc:mospi/sop_frame_validation.pdf'],
      [lessonMap[`${courseMap['CRS_STAT_101']}_Stratification & Multi-Stage Cluster Designs`], 'Sample PSU Allocation Worksheet', 'dataset', 'data:samples/psu_allocation_template.xlsx'],
      [lessonMap[`${courseMap['CRS_STAT_201']}_Overview of SNA 2008 Sequence of Accounts`], 'UN SNA 2008 Chapter 6: Production Account Guide', 'document', 'doc:un_sna/sna2008_ch06.pdf'],
      [lessonMap[`${courseMap['CRS_STAT_201']}_Supply-Use Tables (SUT) & Input-Output Matrices`], 'National Accounts SUT Compilation Framework', 'reference_manual', 'doc:nad/sut_compilation_framework.pdf'],
      [lessonMap[`${courseMap['CRS_TECH_101']}_Python Environment & Data Structures for Statistics`], 'Official Statistical Python Starter Notebook', 'document', 'nb:statistical_python_starter.ipynb'],
      [lessonMap[`${courseMap['CRS_TECH_101']}_Data Cleaning, Validation & Anomaly Detection`], 'Sample Household Survey Raw Microdata (10k records)', 'dataset', 'data:surveys/sample_household_raw.csv'],
      [lessonMap[`${courseMap['CRS_TECH_102']}_Window Functions, CTEs & Complex Statistical Extractions`], 'SQL Statistical Recipes & Analytical Patterns Guide', 'reference_manual', 'doc:tech/sql_statistical_patterns.pdf'],
      [lessonMap[`${courseMap['CRS_GOV_101']}_Statistical Anonymization & De-Identification Techniques`], 'MoSPI Data Anonymization Guidelines & Checklist', 'guideline', 'doc:governance/anonymization_guidelines.pdf'],
      [lessonMap[`${courseMap['CRS_MGT_101']}_Fundamental Principles of Official Statistics & Ethics`], 'UN Fundamental Principles of Official Statistics Charter', 'document', 'doc:un/fundamental_principles_statistics.pdf']
    ];

    for (const m of materials) {
      if (m[0]) {
        insertMaterial.run(m[0], m[1], m[2], m[3]);
      }
    }
    console.log('[Seed] Sample learning materials seeded.');

    // 8c. Sample Knowledge Verification Quizzes (1 per course)
    const insertQuiz = db.prepare(`
      INSERT OR IGNORE INTO quizzes (course_id, competency_id, title, description, pass_percentage)
      VALUES (?, ?, ?, ?, ?)
    `);

    const quizzes = [
      [courseMap['CRS_STAT_101'], compMap['STAT_SAMPLING'], 'Survey Sampling & Estimation Techniques Mastery Quiz', 'Assess your knowledge in sampling frame selection, multi-stage stratification, and variance calculation.', 75.0],
      [courseMap['CRS_STAT_201'], compMap['STAT_NAT_ACCOUNTS'], 'National Accounts & GDP Compilation Verification Quiz', 'Evaluate your understanding of SNA 2008 sequences, GVA compilation, and Supply-Use Table commodity balances.', 70.0],
      [courseMap['CRS_TECH_101'], compMap['TECH_PYTHON'], 'Python & Pandas Statistical Workflows Quiz', 'Demonstrate proficiency in Pandas DataFrame filtering, data cleaning pipelines, and automated aggregations.', 75.0],
      [courseMap['CRS_TECH_102'], compMap['TECH_SQL'], 'Government SQL Data Extraction & Analytics Quiz', 'Verify SQL query optimization, aggregate grouping, and advanced analytical window functions.', 70.0],
      [courseMap['CRS_GOV_101'], compMap['GOV_DATA_PRIVACY'], 'Data Privacy, Security & Governance Compliance Quiz', 'Check comprehension of DPDP Act obligations, microdata anonymization, and cyber security hygiene.', 75.0],
      [courseMap['CRS_MGT_101'], compMap['BEH_LEADERSHIP'], 'Project Leadership & Statistical Ethics Quiz', 'Test your skills in public sector statistical leadership, stakeholder communication, and scientific integrity.', 70.0]
    ];

    for (const q of quizzes) {
      insertQuiz.run(q[0], q[1], q[2], q[3], q[4]);
    }
    console.log('[Seed] 6 Knowledge quizzes seeded.');

    // Fetch quiz IDs
    const quizRows = db.prepare('SELECT id, course_id FROM quizzes').all();
    const quizMap = {};
    for (const q of quizRows) {
      quizMap[q.course_id] = q.id;
    }

    // 8d. Quiz Questions (3-4 questions per quiz)
    const insertQuizQuestion = db.prepare(`
      INSERT OR IGNORE INTO quiz_questions (quiz_id, question_text, options_json, correct_option_index, explanation, sequence_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const quizQuestions = [
      // QZ_STAT_101
      [
        quizMap[courseMap['CRS_STAT_101']],
        'When conducting multi-stage cluster sampling, what is the primary purpose of calculating design effects (Deff)?',
        JSON.stringify([
          'To assess variance inflation under complex clustering relative to simple random sampling (SRSWOR)',
          'To completely eliminate the requirement for primary sampling units (PSUs)',
          'To artificially reduce the required field sample size without budgetary review',
          'To replace collected survey records with synthetic census predictions'
        ]),
        0,
        'The Design Effect (Deff) quantifies the ratio of sample variance under a complex cluster design relative to an equal-sized simple random sample.',
        1
      ],
      [
        quizMap[courseMap['CRS_STAT_101']],
        'In stratified random sampling, which sample allocation strategy minimizes overall estimation variance for a fixed total budget when stratum standard deviations differ?',
        JSON.stringify([
          'Neyman / Optimum Allocation (allocating sample size proportional to stratum size and variance)',
          'Equal Sample Allocation across all strata regardless of size',
          'Arbitrary unweighted allocation based on field enumerator preference',
          'Uniform systematic cluster sampling'
        ]),
        0,
        'Neyman optimum allocation distributes sample units proportional to stratum size and stratum standard deviation, minimizing overall survey variance.',
        2
      ],
      [
        quizMap[courseMap['CRS_STAT_101']],
        'What is the finite population correction (FPC) factor used when calculating sample variance in SRSWOR from a finite population of size N?',
        JSON.stringify([
          '(1 - n / N)',
          '(1 + n / N)',
          '(N / n)^2',
          '(n - 1) / N'
        ]),
        0,
        'The finite population correction factor (1 - f) where f = n/N accounts for sampling without replacement from a finite population.',
        3
      ],

      // QZ_STAT_201
      [
        quizMap[courseMap['CRS_STAT_201']],
        'In the System of National Accounts (SNA 2008), how is Gross Value Added (GVA) at basic prices computed from output and inputs?',
        JSON.stringify([
          'Gross Output at basic prices minus Intermediate Consumption',
          'Total Household Final Consumption Expenditure plus Imports',
          'Gross Domestic Product at market prices plus Total Product Subsidies',
          'Net Operating Surplus minus Compensation of Employees'
        ]),
        0,
        'GVA at basic prices is defined as Gross Output valued at basic prices less Intermediate Consumption valued at purchasers prices.',
        1
      ],
      [
        quizMap[courseMap['CRS_STAT_201']],
        'Which fundamental macroeconomic balancing identity must hold true within the Supply-Use Tables (SUT) framework for each commodity group?',
        JSON.stringify([
          'Total Supply at purchasers prices equals Total Use (Intermediate + Final + Exports) at purchasers prices',
          'Total Domestic Output must equal Total Foreign Imports in every sector',
          'Gross Fixed Capital Formation must equal Zero in services industries',
          'Government Final Consumption must equal Total Indirect Taxes'
        ]),
        0,
        'The fundamental commodity balance in SUT requires total supply at purchasers prices to equal total uses at purchasers prices.',
        2
      ],
      [
        quizMap[courseMap['CRS_STAT_201']],
        'Under the SNA production boundary, which institutional sector includes market producers primarily engaged in producing financial intermediation services?',
        JSON.stringify([
          'Financial Corporations Sector (S.12)',
          'General Government Sector (S.13)',
          'Non-Financial Corporations Sector (S.11)',
          'Non-Profit Institutions Serving Households (S.15)'
        ]),
        0,
        'Sector S.12 encompasses resident financial corporations providing banking, insurance, and financial intermediary services.',
        3
      ],

      // QZ_TECH_101
      [
        quizMap[courseMap['CRS_TECH_101']],
        'In Python Pandas, which method is the most reliable and idiomatic way to count missing (NaN/None) values per column in a survey microdata DataFrame?',
        JSON.stringify([
          'df.isna().sum()',
          'df.dropna().count()',
          'df.find_nulls().total()',
          'df.replace_empty().length()'
        ]),
        0,
        'df.isna().sum() creates a boolean mask of missing values and sums True values per column.',
        1
      ],
      [
        quizMap[courseMap['CRS_TECH_101']],
        'When combining a household survey dataset with a district administrative master table on matching State_Code and District_Code, which Pandas function is best suited?',
        JSON.stringify([
          'pd.merge(df_households, df_districts, on=["State_Code", "District_Code"], how="left")',
          'pd.concat([df_households, df_districts], axis=1)',
          'df_households.append(df_districts)',
          'df_households.combine_rows(df_districts)'
        ]),
        0,
        'pd.merge() with key columns and how="left" joins tabular records based on relational key fields.',
        2
      ],
      [
        quizMap[courseMap['CRS_TECH_101']],
        'To apply a high-performance conditional transformation across an entire DataFrame column without slow Python for-loops, which approach is recommended?',
        JSON.stringify([
          'numpy.where(condition, value_if_true, value_if_false)',
          'for index, row in df.iterrows(): process(row)',
          'while loop incrementing integer index',
          'converting the entire column to Python list and iterating'
        ]),
        0,
        'numpy.where() provides vectorized C-level execution for conditional assignments over NumPy arrays and Pandas Series.',
        3
      ],

      // QZ_TECH_102
      [
        quizMap[courseMap['CRS_TECH_102']],
        'Which SQL window function assigns consecutive integer ranks to survey rows within partitioned groups without skipping ranking numbers when ties occur?',
        JSON.stringify([
          'DENSE_RANK() OVER (PARTITION BY state_id ORDER BY score DESC)',
          'RANK() OVER (ORDER BY score DESC)',
          'ROW_NUMBER() OVER (ORDER BY state_id ASC)',
          'PERCENT_RANK() OVER ()'
        ]),
        0,
        'DENSE_RANK() generates contiguous rank numbers without gaps when multiple rows share identical ordering values.',
        1
      ],
      [
        quizMap[courseMap['CRS_TECH_102']],
        'What is the primary architectural purpose of using Common Table Expressions (WITH clause CTEs) in complex statistical SQL scripts?',
        JSON.stringify([
          'Structuring multi-step data pipelines into readable, maintainable, modular temporary result sets',
          'Permanently creating physical hard drive table partitions',
          'Disabling transactional ACID guarantees for faster writes',
          'Encrypting SQL query strings in audit logs'
        ]),
        0,
        'CTEs break down complex nested queries into intuitive, sequential, and testable modular building blocks.',
        2
      ],
      [
        quizMap[courseMap['CRS_TECH_102']],
        'Which SQL clause is required to filter aggregated group statistics (such as showing only districts where average household income exceeds 50,000)?',
        JSON.stringify([
          'HAVING AVG(household_income) > 50000',
          'WHERE AVG(household_income) > 50000',
          'GROUP FILTER (AVG > 50000)',
          'ORDER BY AVG(household_income) FILTER'
        ]),
        0,
        'The HAVING clause filters grouped summary records generated by GROUP BY aggregate calculations.',
        3
      ],

      // QZ_GOV_101
      [
        quizMap[courseMap['CRS_GOV_101']],
        'Under statistical k-anonymity principles, a public microdata release satisfies k-anonymity if and only if:',
        JSON.stringify([
          'Each combination of quasi-identifying attributes is shared by at least k distinct respondent records',
          'Exactly k records are randomly deleted from the raw dataset',
          'The microdata file is protected with a k-character cryptographic password',
          'The dataset is shared exclusively with k approved government researchers'
        ]),
        0,
        'k-anonymity ensures that quasi-identifiers cannot single out any individual respondent from a group of at least k individuals.',
        1
      ],
      [
        quizMap[courseMap['CRS_GOV_101']],
        'Under India Digital Personal Data Protection (DPDP) Act compliance, what is required before disseminating statistical microdata to public repositories?',
        JSON.stringify([
          'Rigorous de-identification and anonymization to prevent re-identification of individual data principals',
          'Retaining direct respondent contact numbers for phone verification by researchers',
          'Commercial monetization of raw respondent survey responses',
          'Waiving all government data protection audits'
        ]),
        0,
        'Statistical authorities are legally obligated to anonymize microdata to safeguard respondent confidentiality.',
        2
      ],
      [
        quizMap[courseMap['CRS_GOV_101']],
        'What is the standard cybersecurity protocol when an official receives an unsolicited email containing an unexpected executable attachment (.exe)?',
        JSON.stringify([
          'Do not open the file; immediately report the suspected phishing attempt to the departmental CISO / IT security team',
          'Execute the file immediately to verify its statistical contents',
          'Forward the attachment to all wing colleagues for second opinions',
          'Rename the file extension to .csv and upload to the database server'
        ]),
        0,
        'Suspicious attachments must never be executed and should be reported to security officers to prevent malware infiltration.',
        3
      ],

      // QZ_MGT_101
      [
        quizMap[courseMap['CRS_MGT_101']],
        'When presenting major statistical revisions (such as rebasing of CPI or GDP indices) to policy stakeholders and media, what is the best practice?',
        JSON.stringify([
          'Publish transparent methodological notes, clear bridging comparisons, and plain-language executive summaries',
          'Conceal previous base year figures to avoid questions',
          'Refuse to answer public methodology queries',
          'Attribute statistical changes solely to field enumerator errors'
        ]),
        0,
        'Impartial transparency and clear methodological explanations maintain public and stakeholder trust in official statistics.',
        1
      ],
      [
        quizMap[courseMap['CRS_MGT_101']],
        'Under the UN Fundamental Principles of Official Statistics, Principle 1 highlights that:',
        JSON.stringify([
          'Official statistics constitute an indispensable element in the information system of a democratic society, provided on an impartial basis',
          'Statistical datasets should be sold exclusively to private commercial bidders',
          'Government statistical methodology must be kept confidential from the general public',
          'Statistical figures may be adjusted to meet political targets without audit'
        ]),
        0,
        'Principle 1 affirms the fundamental role of impartial, high-quality, publicly accessible official statistics in democratic governance.',
        2
      ],
      [
        quizMap[courseMap['CRS_MGT_101']],
        'During nationwide statistical field operations, which management practice most effectively minimizes non-sampling error?',
        JSON.stringify([
          'Concurrent supervisory field inspections, standardized validation protocols, and real-time feedback loops',
          'Completely eliminating field supervision to accelerate delivery timelines',
          'Discarding questionnaires that contain minor handwriting differences',
          'Allowing enumerators to substitute sample households without logging documentation'
        ]),
        0,
        'Active supervision and structured validation loops during field collection identify and correct non-sampling errors early.',
        3
      ]
    ];

    for (const q of quizQuestions) {
      if (q[0]) {
        insertQuizQuestion.run(q[0], q[1], q[2], q[3], q[4], q[5]);
      }
    }
    console.log('[Seed] 18 Quiz questions seeded across 6 quizzes.');

    // 9. Achievement Definitions (for Pallav / Gamification foundation)
    const insertAch = db.prepare(`
      INSERT OR IGNORE INTO achievement_definitions (code, title, description, icon, category, threshold_criteria_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const achievements = [
      ['ACH_FIRST_BASELINE', 'Baseline Established', 'Completed initial competency baseline assessment across all domains.', 'compass', 'milestone', JSON.stringify({ type: 'baseline_completed' })],
      ['ACH_STAT_PIONEER', 'Statistical Pioneer', 'Scored 80% or above in Statistical domain assessment.', 'chart-bar', 'domain', JSON.stringify({ domain: 'Statistical', score_threshold: 80 })],
      ['ACH_GROWTH_10PCT', 'Growth Momentum', 'Achieved 10% competency growth from initial baseline score.', 'trending-up', 'growth', JSON.stringify({ growth_percent: 10 })],
      ['ACH_GROWTH_20PCT', 'Skill Crusader', 'Achieved 20% competency growth from initial baseline score.', 'trending-up', 'growth', JSON.stringify({ growth_percent: 20 })],
      ['ACH_GROWTH_35PCT', 'Domain Expert', 'Achieved 35% competency growth from initial baseline score.', 'star', 'growth', JSON.stringify({ growth_percent: 35 })],
      ['ACH_GROWTH_50PCT', 'Master Specialist', 'Achieved 50% competency growth from initial baseline score.', 'crown', 'growth', JSON.stringify({ growth_percent: 50 })],
      ['ACH_DIGITAL_CHAMPION', 'Digital Governance Champion', 'Demonstrated top-tier mastery in government cyber and data privacy compliance.', 'shield', 'governance', JSON.stringify({ domain: 'Digital Governance', score_threshold: 80 })],
      ['ACH_FIRST_LESSON', 'Knowledge Seeker', 'Completed first learning lesson in NAVBODH Academy.', 'book-open', 'learning', JSON.stringify({ type: 'first_lesson' })],
      ['ACH_FIRST_QUIZ', 'Quiz Master', 'Passed knowledge verification quiz with passing score.', 'award', 'learning', JSON.stringify({ type: 'first_quiz' })],
      ['ACH_COURSE_COMPLETE', 'Course Champion', 'Completed all lessons in a full statistical training course.', 'graduation-cap', 'learning', JSON.stringify({ type: 'course_complete' })],
      ['ACH_STREAK_3', 'Consistent Learner', 'Maintained an active 3-day learning streak.', 'zap', 'streak', JSON.stringify({ streak_days: 3 })],
      ['ACH_STREAK_7', 'Dedicated Scholar', 'Maintained an active 7-day learning streak.', 'fire', 'streak', JSON.stringify({ streak_days: 7 })]
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
