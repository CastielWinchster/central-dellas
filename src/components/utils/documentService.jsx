/**
 * Document service — replaces Firebase Storage + Firestore
 * Uses Base44 UploadFile integration + DriverDocument entity
 */
import { base44 } from '@/api/base44Client';

/**
 * Upload a file and return its URL
 */
export async function uploadDocFile(userId, path, file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}

/**
 * Save driver documents to DriverDocument entity
 */
export async function saveDriverDocuments(userId, data) {
  const existing = await base44.entities.DriverDocument.filter({ user_id: userId });

  const record = {
    user_id: userId,
    // CNH
    driver_license_number: data.cnh?.number || '',
    driver_license_photo: data.cnh?.frontPhoto || '',
    cnh_back_photo: data.cnh?.backPhoto || '',
    cnh_category: data.cnh?.category || '',
    cnh_expires_at: data.cnh?.expiresAt || '',
    // RG
    rg_number: data.rg?.number || '',
    rg_issuer: data.rg?.issuer || '',
    rg_front_photo: data.rg?.frontPhoto || '',
    rg_back_photo: data.rg?.backPhoto || '',
    // Vehicle
    vehicle_plate: data.vehicle?.plate || '',
    vehicle_renavam: data.vehicle?.renavam || '',
    vehicle_brand: data.vehicle?.brand || '',
    vehicle_model: data.vehicle?.model || '',
    vehicle_year: data.vehicle?.year || null,
    vehicle_color: data.vehicle?.color || '',
    vehicle_owner_name: data.vehicle?.ownerName || '',
    vehicle_document_photo: data.vehicle?.photo || '',
    // Insurance
    insurance_insurer: data.insurance?.insurer || '',
    insurance_policy_number: data.insurance?.policyNumber || '',
    insurance_expires_at: data.insurance?.expiresAt || '',
    insurance_photo: data.insurance?.photo || '',
    // Status
    verification_status: data.status === 'under_review' ? 'pending' : (data.status || 'pending'),
    responsibility_term: data.responsibilityTerm || false,
    submitted_at: data.submittedAt || new Date().toISOString(),
  };

  if (existing.length > 0) {
    await base44.entities.DriverDocument.update(existing[0].id, record);
  } else {
    await base44.entities.DriverDocument.create(record);
  }
}

/**
 * Fetch driver documents, normalized to match the old Firebase structure
 */
export async function getDriverDocuments(userId) {
  const docs = await base44.entities.DriverDocument.filter({ user_id: userId });
  if (docs.length === 0) return null;

  const d = docs[0];
  // Map verification_status back to the "status" field the page uses
  let status = d.verification_status || 'pending';
  if (status === 'pending' && d.submitted_at) status = 'under_review';

  return {
    status,
    submittedAt: d.submitted_at || null,
    responsibilityTerm: d.responsibility_term || false,
    cnh: {
      number: d.driver_license_number || '',
      category: d.cnh_category || '',
      expiresAt: d.cnh_expires_at || '',
      frontPhoto: d.driver_license_photo || '',
      backPhoto: d.cnh_back_photo || '',
    },
    rg: {
      number: d.rg_number || '',
      issuer: d.rg_issuer || '',
      frontPhoto: d.rg_front_photo || '',
      backPhoto: d.rg_back_photo || '',
    },
    vehicle: {
      plate: d.vehicle_plate || '',
      renavam: d.vehicle_renavam || '',
      brand: d.vehicle_brand || '',
      model: d.vehicle_model || '',
      year: d.vehicle_year || '',
      color: d.vehicle_color || '',
      ownerName: d.vehicle_owner_name || '',
      photo: d.vehicle_document_photo || '',
    },
    insurance: {
      insurer: d.insurance_insurer || '',
      policyNumber: d.insurance_policy_number || '',
      expiresAt: d.insurance_expires_at || '',
      photo: d.insurance_photo || '',
    },
  };
}