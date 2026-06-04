const pool = require("../db");
const {
  cleanOptionalText,
  cleanText,
  getMissingPartnerSchoolFields,
  serializeSchool,
  toBoolean,
  toNumber,
  toPositiveInteger,
} = require("../utils/schoolVerification");

const getMySchool = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM driving_schools
       WHERE owner_user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({});
    }

    const school = serializeSchool(result.rows[0]);

    return res.json({
      success: true,
      school,
      ...school,
    });
  } catch (error) {
    console.error("Get my school error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting driving school",
    });
  }
};

const createOrUpdateMySchool = async (req, res) => {
  try {
    const {
      school_name,
      description,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      service_radius_km,
      owner_name,
      owner_phone,
      owner_email,
      google_maps_link,
      license_number,
      license_document_url,
      owner_id_proof_url,
      pan_number,
      gst_number,
      bank_account_name,
      bank_account_number,
      ifsc,
      upi_id,
      working_hours,
      pickup_drop_available,
    } = req.body;

    const missingFields = getMissingPartnerSchoolFields(req.body);

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const schoolValues = {
      schoolName: cleanText(school_name),
      description: cleanText(description),
      email: cleanText(email),
      phone: cleanText(phone),
      address: cleanText(address),
      city: cleanText(city),
      state: cleanText(state),
      pincode: cleanText(pincode),
      latitude: toNumber(latitude, 0),
      longitude: toNumber(longitude, 0),
      serviceRadiusKm: toPositiveInteger(service_radius_km, 10),
      ownerName: cleanText(owner_name),
      ownerPhone: cleanText(owner_phone),
      ownerEmail: cleanText(owner_email),
      googleMapsLink: cleanText(google_maps_link),
      licenseNumber: cleanText(license_number),
      licenseDocumentUrl: cleanText(license_document_url),
      ownerIdProofUrl: cleanText(owner_id_proof_url),
      panNumber: cleanText(pan_number),
      gstNumber: cleanOptionalText(gst_number),
      bankAccountName: cleanText(bank_account_name),
      bankAccountNumber: cleanText(bank_account_number),
      ifsc: cleanText(ifsc),
      upiId: cleanText(upi_id),
      workingHours: cleanText(working_hours),
      pickupDropAvailable: toBoolean(pickup_drop_available),
    };

    const existingSchool = await pool.query(
      `SELECT id, status
       FROM driving_schools
       WHERE owner_user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    let result;

    if (existingSchool.rows.length > 0) {
      const schoolId = existingSchool.rows[0].id;

      result = await pool.query(
        `UPDATE driving_schools
         SET
          school_name = $1,
          description = $2,
          email = $3,
          phone = $4,
          address = $5,
          city = $6,
          state = $7,
          pincode = $8,
          latitude = $9,
          longitude = $10,
          service_radius_km = $11,
          owner_name = $12,
          owner_phone = $13,
          owner_email = $14,
          google_maps_link = $15,
          license_number = $16,
          license_document_url = $17,
          owner_id_proof_url = $18,
          pan_number = $19,
          gst_number = $20,
          bank_account_name = $21,
          bank_account_number = $22,
          ifsc = $23,
          upi_id = $24,
          working_hours = $25,
          pickup_drop_available = $26,
          status = 'PENDING',
          verification_status = 'PENDING',
          rejection_reason = NULL,
          verification_submitted_at = NOW(),
          verification_reviewed_at = NULL,
          verification_reviewed_by = NULL,
          updated_at = NOW()
         WHERE id = $27
         RETURNING *`,
        [
          schoolValues.schoolName,
          schoolValues.description,
          schoolValues.email,
          schoolValues.phone,
          schoolValues.address,
          schoolValues.city,
          schoolValues.state,
          schoolValues.pincode,
          schoolValues.latitude,
          schoolValues.longitude,
          schoolValues.serviceRadiusKm,
          schoolValues.ownerName,
          schoolValues.ownerPhone,
          schoolValues.ownerEmail,
          schoolValues.googleMapsLink,
          schoolValues.licenseNumber,
          schoolValues.licenseDocumentUrl,
          schoolValues.ownerIdProofUrl,
          schoolValues.panNumber,
          schoolValues.gstNumber,
          schoolValues.bankAccountName,
          schoolValues.bankAccountNumber,
          schoolValues.ifsc,
          schoolValues.upiId,
          schoolValues.workingHours,
          schoolValues.pickupDropAvailable,
          schoolId,
        ]
      );

      const school = serializeSchool(result.rows[0]);

      return res.json({
        success: true,
        message: "School profile submitted for admin review.",
        school,
        ...school,
      });
    }

    result = await pool.query(
      `INSERT INTO driving_schools
       (
        owner_user_id,
        school_name,
        description,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        latitude,
        longitude,
        service_radius_km,
        owner_name,
        owner_phone,
        owner_email,
        google_maps_link,
        license_number,
        license_document_url,
        owner_id_proof_url,
        pan_number,
        gst_number,
        bank_account_name,
        bank_account_number,
        ifsc,
        upi_id,
        working_hours,
        pickup_drop_available,
        status,
        verification_status,
        rejection_reason,
        verification_submitted_at
       )
       VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
        $27, 'PENDING', 'PENDING', NULL, NOW())
       RETURNING *`,
      [
        req.user.id,
        schoolValues.schoolName,
        schoolValues.description,
        schoolValues.email,
        schoolValues.phone,
        schoolValues.address,
        schoolValues.city,
        schoolValues.state,
        schoolValues.pincode,
        schoolValues.latitude,
        schoolValues.longitude,
        schoolValues.serviceRadiusKm,
        schoolValues.ownerName,
        schoolValues.ownerPhone,
        schoolValues.ownerEmail,
        schoolValues.googleMapsLink,
        schoolValues.licenseNumber,
        schoolValues.licenseDocumentUrl,
        schoolValues.ownerIdProofUrl,
        schoolValues.panNumber,
        schoolValues.gstNumber,
        schoolValues.bankAccountName,
        schoolValues.bankAccountNumber,
        schoolValues.ifsc,
        schoolValues.upiId,
        schoolValues.workingHours,
        schoolValues.pickupDropAvailable,
      ]
    );

    const school = serializeSchool(result.rows[0]);

    return res.status(201).json({
      success: true,
      message: "School profile submitted for admin review.",
      school,
      ...school,
    });
  } catch (error) {
    console.error("Create/update school error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while saving driving school",
    });
  }
};

module.exports = {
  getMySchool,
  createOrUpdateMySchool,
};
