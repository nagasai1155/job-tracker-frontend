/**
 * Renders the Add Job modal HTML (hidden by default).
 */
export function AddJobModal() {
  return `
    <div class="modal-overlay" id="jobModal">
      <div class="modal-content">
        <h2 style="margin-bottom:1.5rem">Add New Application</h2>
        <form id="addJobForm">
          <div class="form-group">
            <label for="jobTitle">Job Title</label>
            <input type="text" id="jobTitle" required placeholder="e.g. Frontend Developer">
          </div>
          <div class="form-group">
            <label for="jobCompany">Company</label>
            <input type="text" id="jobCompany" required placeholder="e.g. Google">
          </div>
          <div class="form-group">
            <label for="jobStatus">Status</label>
            <select id="jobStatus">
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="closeModalBtn">Cancel</button>
            <button type="submit" class="btn">Save Job</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
