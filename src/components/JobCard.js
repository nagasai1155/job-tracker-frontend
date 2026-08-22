/**
 * Renders a single job application card.
 * @param {object} job - The job object.
 */
export function JobCard(job) {
  const appliedDate = new Date(job.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `
    <div class="job-card" data-status="${job.status}" data-id="${job.id}">
      <div class="job-header">
        <div>
          <div class="job-title">${job.title}</div>
          <div class="job-company">${job.company}</div>
        </div>
        <span class="job-status status-${job.status}">${job.status}</span>
      </div>
      <div class="job-footer">
        <span>📅 Applied: ${appliedDate}</span>
        <button class="btn-delete" data-id="${job.id}" title="Delete">✕</button>
      </div>
    </div>
  `;
}
