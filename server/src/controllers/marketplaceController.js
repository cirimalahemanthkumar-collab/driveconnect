const pool = require("../db");
const { serializeSchool } = require("../utils/schoolVerification");

const getMarketplaceSummary = async (req, res) => {
  try {
    const schema = await getMarketplaceSchema();

    if (!hasColumns(schema.driving_schools, ["id", "school_name"])) {
      return res.json(emptyMarketplaceSummary());
    }

    const approvedWhere = buildApprovedSchoolWhere(schema.driving_schools, "ds");

    if (!approvedWhere) {
      return res.json(emptyMarketplaceSummary());
    }

    const schoolCountResult = await pool.query(
      `SELECT COUNT(*)::int AS approved_school_count
       FROM driving_schools ds
       WHERE ${approvedWhere}`
    );

    const [
      averageRating,
      activeCourseCount,
      slotSummary,
      featuredSchools,
    ] = await Promise.all([
      getMarketplaceAverageRating(schema, approvedWhere),
      getActiveCourseCount(schema, approvedWhere),
      getMarketplaceSlotSummary(schema, approvedWhere),
      getFeaturedSchools(schema, approvedWhere),
    ]);

    return res.json({
      success: true,
      approved_school_count: Number(schoolCountResult.rows[0]?.approved_school_count) || 0,
      average_rating: averageRating,
      active_course_count: activeCourseCount,
      earliest_slot: slotSummary.earliest_slot,
      latest_slot: slotSummary.latest_slot,
      featured_schools: featuredSchools,
    });
  } catch (error) {
    console.error("Get marketplace summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting marketplace summary",
    });
  }
};

const getApprovedSchools = async (req, res) => {
  try {
    const schema = await getMarketplaceSchema();

    if (!hasColumns(schema.driving_schools, ["id", "school_name"])) {
      return res.json({ success: true, count: 0, schools: [] });
    }

    const approvedWhere = buildApprovedSchoolWhere(schema.driving_schools, "ds");

    if (!approvedWhere) {
      return res.json({ success: true, count: 0, schools: [] });
    }

    const values = [];
    const whereParts = [approvedWhere];
    const locationTerm = firstQueryText(req.query.location, req.query.city, req.query.q, req.query.search);
    const vehicleType = firstQueryText(req.query.vehicle_type, req.query.vehicleType);
    const pickupFilter = parseBooleanFilter(req.query.pickup_drop_available ?? req.query.pickupDropAvailable ?? req.query.pickup);
    const lat = Number(firstQueryText(req.query.lat, req.query.latitude));
    const lng = Number(firstQueryText(req.query.lng, req.query.longitude));
    const radiusKm = Number(firstQueryText(req.query.radius_km, req.query.radiusKm));
    const hasGeoSearch = Number.isFinite(lat) && Number.isFinite(lng) && hasColumns(schema.driving_schools, ["latitude", "longitude"]);

    appendSchoolTextSearch(whereParts, values, schema.driving_schools, locationTerm);
    appendVehicleTypeFilter(whereParts, values, schema, vehicleType);
    appendPickupFilter(whereParts, values, schema.driving_schools, pickupFilter);

    let distanceSelect = "NULL::numeric AS distance_km";
    let distanceOrder = "";

    if (hasGeoSearch) {
      const latPlaceholder = addQueryValue(values, lat);
      const lngPlaceholder = addQueryValue(values, lng);
      const distanceExpression = distanceKmExpression("ds", latPlaceholder, lngPlaceholder);
      distanceSelect = `${distanceExpression} AS distance_km`;
      distanceOrder = "distance_km ASC NULLS LAST, ";

      if (Number.isFinite(radiusKm) && radiusKm > 0) {
        const radiusPlaceholder = addQueryValue(values, radiusKm);
        whereParts.push(`${distanceExpression} <= ${radiusPlaceholder}`);
      }
    }

    const query = `
      SELECT
        ds.${quoteIdent("id")},
        ds.${quoteIdent("school_name")},
        ${schoolTextExpression(schema.driving_schools, "city")} AS city,
        ${schoolTextExpression(schema.driving_schools, "state")} AS state,
        ${schoolTextExpression(schema.driving_schools, "address")} AS address,
        ${schoolTextExpression(schema.driving_schools, "pincode")} AS pincode,
        ${schoolTextExpression(schema.driving_schools, "description")} AS description,
        ${schoolBooleanExpression(schema.driving_schools, "pickup_drop_available")} AS pickup_drop_available,
        ${schoolRatingExpression(schema.driving_schools)} AS rating,
        ${schoolVerificationExpression(schema.driving_schools)} AS verification_status,
        COALESCE(course_summary.course_count, 0) AS course_count,
        course_summary.starting_price,
        ${distanceSelect}
      FROM driving_schools ds
      ${buildCourseSummaryJoin(schema)}
      WHERE ${whereParts.join(" AND ")}
      ORDER BY ${distanceOrder}rating DESC NULLS LAST, course_count DESC, school_name ASC`;

    const result = await pool.query(query, values);
    const schools = result.rows.map((row) => publicSchoolPreview(serializeSchool(row)));

    return res.json({
      success: true,
      count: schools.length,
      schools,
    });
  } catch (error) {
    console.error("Get approved schools error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting schools",
    });
  }
};

const getSchoolDetails = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const schema = await getMarketplaceSchema();
    const approvedWhere = buildApprovedSchoolWhere(schema.driving_schools, "ds");

    if (!approvedWhere) {
      return res.status(404).json({
        success: false,
        message: "Approved driving school not found",
      });
    }

    const schoolResult = await pool.query(
      `SELECT ds.*
       FROM driving_schools ds
       WHERE ds.id = $1
       AND ${approvedWhere}`,
      [schoolId]
    );

    if (schoolResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Approved driving school not found",
      });
    }

    const coursesResult = await pool.query(
      `SELECT
        id,
        school_id,
        course_name,
        course_name AS "courseName",
        course_type,
        course_type AS "courseType",
        vehicle_type,
        vehicle_type AS "vehicleType",
        transmission,
        duration_days,
        duration_days AS "durationDays",
        total_sessions,
        total_sessions AS "totalSessions",
        price,
        advance_amount,
        advance_amount AS "advanceAmount",
        description,
        is_active,
        created_at,
        created_at AS "createdAt"
       FROM courses
       WHERE school_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [schoolId]
    );

    const school = serializeSchool(schoolResult.rows[0]);

    return res.json({
      success: true,
      school,
      ...school,
      courses: coursesResult.rows,
    });
  } catch (error) {
    console.error("Get school details error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting school details",
    });
  }
};

const getAvailableCourses = async (req, res) => {
  try {
    const { city, vehicle_type, transmission } = req.query;

    let query = `
      SELECT
        c.id,
        c.school_id,
        c.course_name,
        c.course_name AS "courseName",
        c.course_type,
        c.course_type AS "courseType",
        c.vehicle_type,
        c.vehicle_type AS "vehicleType",
        c.transmission,
        c.duration_days,
        c.duration_days AS "durationDays",
        c.total_sessions,
        c.total_sessions AS "totalSessions",
        c.price,
        c.advance_amount,
        c.advance_amount AS "advanceAmount",
        c.description,
        c.is_active,
        c.created_at,
        c.created_at AS "createdAt",
        ds.school_name,
        ds.city,
        ds.state,
        ds.address,
        ds.average_rating,
        ds.total_reviews
      FROM courses c
      JOIN driving_schools ds ON c.school_id = ds.id
      WHERE ds.status::text = 'APPROVED'
      AND ds.verification_status::text = 'APPROVED'
      AND c.is_active = true
    `;

    const values = [];
    let count = 1;

    if (city) {
      query += ` AND LOWER(ds.city) = LOWER($${count})`;
      values.push(city);
      count++;
    }

    if (vehicle_type) {
      query += ` AND c.vehicle_type = $${count}`;
      values.push(vehicle_type);
      count++;
    }

    if (transmission) {
      query += ` AND c.transmission = $${count}`;
      values.push(transmission);
      count++;
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      count: result.rows.length,
      courses: result.rows,
    });
  } catch (error) {
    console.error("Get available courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting courses",
    });
  }
};

const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query(
      `SELECT
        c.id,
        c.school_id,
        c.course_name,
        c.course_name AS "courseName",
        c.course_type,
        c.course_type AS "courseType",
        c.vehicle_type,
        c.vehicle_type AS "vehicleType",
        c.transmission,
        c.duration_days,
        c.duration_days AS "durationDays",
        c.total_sessions,
        c.total_sessions AS "totalSessions",
        c.price,
        c.advance_amount,
        c.advance_amount AS "advanceAmount",
        c.description,
        c.is_active,
        c.created_at,
        c.created_at AS "createdAt",
        ds.school_name,
        ds.description AS school_description,
        ds.email AS school_email,
        ds.phone AS school_phone,
        ds.address,
        ds.city,
        ds.state,
        ds.pincode,
        ds.latitude,
        ds.longitude,
        ds.average_rating,
        ds.total_reviews
       FROM courses c
       JOIN driving_schools ds ON c.school_id = ds.id
       WHERE c.id = $1
       AND c.is_active = true
       AND ds.status::text = 'APPROVED'
       AND ds.verification_status::text = 'APPROVED'`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      course: result.rows[0],
    });
  } catch (error) {
    console.error("Get course details error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting course details",
    });
  }
};

module.exports = {
  getMarketplaceSummary,
  getApprovedSchools,
  getSchoolDetails,
  getAvailableCourses,
  getCourseDetails,
};

function publicSchoolPreview(school) {
  const courseCount = Number(school.course_count ?? school.courseCount) || 0;
  const rating = Number(school.rating ?? school.average_rating) || 0;
  const startingPrice = school.starting_price ?? school.startingPrice ?? null;
  const distanceKm = Number(school.distance_km ?? school.distanceKm);

  return {
    id: school.id,
    school_name: school.school_name,
    schoolName: school.schoolName,
    city: school.city || "",
    state: school.state || "",
    address: school.address || "",
    pincode: school.pincode || "",
    description: school.description || "",
    pickup_drop_available: Boolean(school.pickup_drop_available),
    pickupDropAvailable: Boolean(school.pickup_drop_available),
    rating,
    average_rating: rating,
    course_count: courseCount,
    courseCount,
    starting_price: startingPrice,
    startingPrice,
    verification_status: school.verification_status,
    verificationStatus: school.verificationStatus,
    distance_km: Number.isFinite(distanceKm) ? Number(distanceKm.toFixed(1)) : null,
    distanceKm: Number.isFinite(distanceKm) ? Number(distanceKm.toFixed(1)) : null,
  };
}

function firstQueryText(...values) {
  for (const value of values) {
    const candidate = Array.isArray(value) ? value[0] : value;
    if (candidate === undefined || candidate === null) continue;

    const text = String(candidate).trim();
    if (text) return text;
  }

  return "";
}

function addQueryValue(values, value) {
  values.push(value);
  return `$${values.length}`;
}

function appendSchoolTextSearch(whereParts, values, columns, searchText) {
  if (!searchText) return;

  const searchableColumns = [
    "city",
    "address",
    "state",
    "pincode",
    "school_name",
    "description",
  ].filter((column) => columns.has(column));

  if (!searchableColumns.length) return;

  const placeholder = addQueryValue(values, `%${searchText}%`);
  const conditions = searchableColumns.map(
    (column) => `LOWER(COALESCE(ds.${quoteIdent(column)}::text, '')) LIKE LOWER(${placeholder})`
  );
  whereParts.push(`(${conditions.join(" OR ")})`);
}

function appendVehicleTypeFilter(whereParts, values, schema, vehicleType) {
  if (!vehicleType) return;

  if (!hasColumns(schema.courses, ["school_id", "vehicle_type"]) || !schema.driving_schools.has("id")) {
    whereParts.push("false");
    return;
  }

  const activeWhere = schema.courses.has("is_active")
    ? `AND filter_course.${quoteIdent("is_active")} = true`
    : "";
  const placeholder = addQueryValue(values, vehicleType);

  whereParts.push(`EXISTS (
    SELECT 1
    FROM courses filter_course
    WHERE filter_course.${quoteIdent("school_id")} = ds.${quoteIdent("id")}
    ${activeWhere}
    AND UPPER(filter_course.${quoteIdent("vehicle_type")}::text) = UPPER(${placeholder})
  )`);
}

function appendPickupFilter(whereParts, values, columns, pickupFilter) {
  if (pickupFilter === null) return;

  if (!columns.has("pickup_drop_available")) {
    if (pickupFilter) whereParts.push("false");
    return;
  }

  const placeholder = addQueryValue(values, pickupFilter);
  whereParts.push(`COALESCE(ds.${quoteIdent("pickup_drop_available")}, false) = ${placeholder}`);
}

function parseBooleanFilter(value) {
  const text = firstQueryText(value).toLowerCase();
  if (!text) return null;
  if (["true", "1", "yes", "y"].includes(text)) return true;
  if (["false", "0", "no", "n"].includes(text)) return false;
  return null;
}

function schoolTextExpression(columns, column) {
  return columns.has(column) ? `ds.${quoteIdent(column)}` : "NULL::text";
}

function schoolBooleanExpression(columns, column) {
  return columns.has(column) ? `COALESCE(ds.${quoteIdent(column)}, false)` : "false";
}

function schoolRatingExpression(columns) {
  const ratingColumn = firstExistingColumn(columns, ["average_rating", "rating"]);
  return ratingColumn ? `NULLIF(ds.${quoteIdent(ratingColumn)}, 0)` : "NULL::numeric";
}

function schoolVerificationExpression(columns) {
  if (columns.has("verification_status")) return `ds.${quoteIdent("verification_status")}::text`;
  if (columns.has("status")) return `ds.${quoteIdent("status")}::text`;
  return "'APPROVED'::text";
}

function distanceKmExpression(alias, latPlaceholder, lngPlaceholder) {
  return `(6371 * acos(LEAST(1, GREATEST(-1,
    cos(radians(${latPlaceholder}::double precision))
    * cos(radians(${alias}.${quoteIdent("latitude")}::double precision))
    * cos(radians(${alias}.${quoteIdent("longitude")}::double precision) - radians(${lngPlaceholder}::double precision))
    + sin(radians(${latPlaceholder}::double precision))
    * sin(radians(${alias}.${quoteIdent("latitude")}::double precision))
  ))))`;
}

function emptyMarketplaceSummary() {
  return {
    success: true,
    approved_school_count: 0,
    average_rating: null,
    active_course_count: 0,
    earliest_slot: null,
    latest_slot: null,
    featured_schools: [],
  };
}

async function getMarketplaceSchema() {
  const result = await pool.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
     AND table_name = ANY($1::text[])`,
    [[
      "driving_schools",
      "courses",
      "reviews",
      "class_sessions",
      "bookings",
    ]]
  );

  return result.rows.reduce((schema, row) => {
    if (!schema[row.table_name]) schema[row.table_name] = new Set();
    schema[row.table_name].add(row.column_name);
    return schema;
  }, {
    driving_schools: new Set(),
    courses: new Set(),
    reviews: new Set(),
    class_sessions: new Set(),
    bookings: new Set(),
  });
}

function buildApprovedSchoolWhere(columns, alias) {
  const approvedChecks = [];
  const blockedChecks = [];

  if (columns.has("status")) {
    approvedChecks.push(`UPPER(${alias}.${quoteIdent("status")}::text) IN ('APPROVED', 'VERIFIED')`);
    blockedChecks.push(`COALESCE(UPPER(${alias}.${quoteIdent("status")}::text), '') NOT IN ('REJECTED', 'SUSPENDED', 'PENDING', 'UNDER_REVIEW')`);
  }

  if (columns.has("verification_status")) {
    approvedChecks.push(`UPPER(${alias}.${quoteIdent("verification_status")}::text) IN ('APPROVED', 'VERIFIED')`);
    blockedChecks.push(`COALESCE(UPPER(${alias}.${quoteIdent("verification_status")}::text), '') NOT IN ('REJECTED', 'SUSPENDED', 'PENDING', 'UNDER_REVIEW')`);
  }

  if (!approvedChecks.length) return "";
  return `(${approvedChecks.join(" OR ")}) AND ${blockedChecks.join(" AND ")}`;
}

async function getActiveCourseCount(schema, approvedWhere) {
  if (!hasColumns(schema.courses, ["id", "school_id"]) || !schema.driving_schools.has("id")) {
    return 0;
  }

  const activeWhere = schema.courses.has("is_active")
    ? `AND c.${quoteIdent("is_active")} = true`
    : "";

  const result = await pool.query(
    `SELECT COUNT(*)::int AS active_course_count
     FROM courses c
     JOIN driving_schools ds ON c.${quoteIdent("school_id")} = ds.${quoteIdent("id")}
     WHERE ${approvedWhere}
     ${activeWhere}`
  );

  return Number(result.rows[0]?.active_course_count) || 0;
}

async function getMarketplaceAverageRating(schema, approvedWhere) {
  if (hasColumns(schema.reviews, ["rating", "school_id"]) && schema.driving_schools.has("id")) {
    const visibleWhere = schema.reviews.has("is_visible")
      ? `AND r.${quoteIdent("is_visible")} = true`
      : "";

    const result = await pool.query(
      `SELECT ROUND(AVG(r.${quoteIdent("rating")})::numeric, 1) AS average_rating
       FROM reviews r
       JOIN driving_schools ds ON r.${quoteIdent("school_id")} = ds.${quoteIdent("id")}
       WHERE ${approvedWhere}
       ${visibleWhere}`
    );

    const rating = Number(result.rows[0]?.average_rating);
    if (Number.isFinite(rating) && rating > 0) return rating;
  }

  const schoolRatingColumn = firstExistingColumn(schema.driving_schools, ["average_rating", "rating"]);

  if (!schoolRatingColumn) return null;

  const reviewCountWhere = schema.driving_schools.has("total_reviews")
    ? `AND COALESCE(ds.${quoteIdent("total_reviews")}, 0) > 0`
    : `AND COALESCE(ds.${quoteIdent(schoolRatingColumn)}, 0) > 0`;

  const result = await pool.query(
    `SELECT ROUND(AVG(ds.${quoteIdent(schoolRatingColumn)})::numeric, 1) AS average_rating
     FROM driving_schools ds
     WHERE ${approvedWhere}
     ${reviewCountWhere}`
  );

  const rating = Number(result.rows[0]?.average_rating);
  return Number.isFinite(rating) && rating > 0 ? rating : null;
}

async function getMarketplaceSlotSummary(schema, approvedWhere) {
  if (
    !hasColumns(schema.class_sessions, ["booking_id", "start_time"]) ||
    !hasColumns(schema.bookings, ["id", "school_id"]) ||
    !schema.driving_schools.has("id")
  ) {
    return { earliest_slot: null, latest_slot: null };
  }

  const result = await pool.query(
    `SELECT
      MIN(cs.${quoteIdent("start_time")})::text AS earliest_slot,
      MAX(cs.${quoteIdent("start_time")})::text AS latest_slot
     FROM class_sessions cs
     JOIN bookings b ON cs.${quoteIdent("booking_id")} = b.${quoteIdent("id")}
     JOIN driving_schools ds ON b.${quoteIdent("school_id")} = ds.${quoteIdent("id")}
     WHERE ${approvedWhere}`
  );

  return {
    earliest_slot: result.rows[0]?.earliest_slot || null,
    latest_slot: result.rows[0]?.latest_slot || null,
  };
}

async function getFeaturedSchools(schema, approvedWhere) {
  if (!hasColumns(schema.driving_schools, ["id", "school_name"])) {
    return [];
  }

  const cityExpression = schema.driving_schools.has("city")
    ? `ds.${quoteIdent("city")}`
    : "NULL::text";
  const descriptionExpression = schema.driving_schools.has("description")
    ? `ds.${quoteIdent("description")}`
    : "NULL::text";
  const pickupExpression = schema.driving_schools.has("pickup_drop_available")
    ? `COALESCE(ds.${quoteIdent("pickup_drop_available")}, false)`
    : "false";
  const ratingColumn = firstExistingColumn(schema.driving_schools, ["average_rating", "rating"]);
  const ratingExpression = ratingColumn
    ? `NULLIF(ds.${quoteIdent(ratingColumn)}, 0)`
    : "NULL::numeric";
  const courseSummaryJoin = buildCourseSummaryJoin(schema);
  const createdOrder = schema.driving_schools.has("created_at")
    ? `, ds.${quoteIdent("created_at")} DESC`
    : "";

  const result = await pool.query(
    `SELECT
      ds.${quoteIdent("id")},
      ds.${quoteIdent("school_name")},
      ${cityExpression} AS city,
      ${descriptionExpression} AS description,
      ${pickupExpression} AS pickup_drop_available,
      ${ratingExpression} AS rating,
      COALESCE(course_summary.course_count, 0) AS course_count,
      course_summary.starting_price
     FROM driving_schools ds
     ${courseSummaryJoin}
     WHERE ${approvedWhere}
     ORDER BY rating DESC NULLS LAST, course_summary.course_count DESC${createdOrder}
     LIMIT 3`
  );

  return result.rows;
}

function buildCourseSummaryJoin(schema) {
  if (!hasColumns(schema.courses, ["school_id"]) || !schema.driving_schools.has("id")) {
    return "LEFT JOIN LATERAL (SELECT 0::int AS course_count, NULL::numeric AS starting_price) course_summary ON true";
  }

  const activeWhere = schema.courses.has("is_active")
    ? `AND c.${quoteIdent("is_active")} = true`
    : "";
  const priceExpression = coursePriceExpression(schema.courses);

  return `LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS course_count,
        MIN(${priceExpression}) AS starting_price
      FROM courses c
      WHERE c.${quoteIdent("school_id")} = ds.${quoteIdent("id")}
      ${activeWhere}
    ) course_summary ON true`;
}

function coursePriceExpression(columns) {
  if (columns.has("discount_price") && columns.has("price")) {
    return `COALESCE(c.${quoteIdent("discount_price")}, c.${quoteIdent("price")})`;
  }

  if (columns.has("price")) return `c.${quoteIdent("price")}`;
  if (columns.has("discount_price")) return `c.${quoteIdent("discount_price")}`;
  return "NULL::numeric";
}

function hasColumns(columns, requiredColumns) {
  return requiredColumns.every((column) => columns.has(column));
}

function firstExistingColumn(columns, names) {
  return names.find((name) => columns.has(name)) || "";
}

function quoteIdent(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}
