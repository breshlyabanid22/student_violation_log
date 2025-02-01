const SUPABASE_URL = 'https://pndfhvdsjrmboefrwimt.supabase.co'
const SUPABASE_KEY = process.env.MY_SUPABASE_KEY
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('violationForm');
const tableBody = document.querySelector('#violationTable tbody');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const addRecordBtn = document.getElementById('addRecordBtn');
const formContainer = document.getElementById('formContainer');
const cancelFormBtn = document.getElementById('cancelFormBtn');

// Toggle form visibility
addRecordBtn.addEventListener('click', () => {
  console.log('Add Record button clicked');
  formContainer.classList.toggle('visible');
});

cancelFormBtn.addEventListener('click', () => {
  formContainer.classList.remove('visible');
});

// Fetch and display violations
async function fetchViolations() {
  const { data, error } = await supabase.from('violations').select('*');
  if (error) console.error('Error fetching violations:', error);
  else renderTable(data);
}

// Render table rows
function renderTable(data) {
    tableBody.innerHTML = '';
    const violationCounts = {};
  
    // Count violations per student based on school_id
    data.forEach(record => {
      if (!violationCounts[record.school_id]) violationCounts[record.school_id] = 0;
      violationCounts[record.school_id]++;
    });
  
    data.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.name}</td>
        <td>${record.school_id}</td>
        <td>${record.grade}</td>
        <td>${record.section}</td>
        <td>${record.violation_types}</td> <!-- Display as comma-separated string -->
        <td>${record.remarks}</td>
        <td class="violation-count ${getViolationColor(violationCounts[record.school_id])}">${violationCounts[record.school_id]}</td>
        <td>
          <button onclick="updateRecord('${record.id}')">Update</button>
          <button onclick="deleteRecord('${record.id}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

// Get violation count color
function getViolationColor(count) {
  if (count === 1) return 'green';
  if (count === 2) return 'orange';
  if (count >= 3) return 'red';
  return '';
}

// Add new violation
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const violationTypes = Array.from(document.querySelectorAll('input[name="violation"]:checked'))
      .map(cb => cb.value)
      .join(', '); // Join selected types into a comma-separated string
  
    const { error } = await supabase.from('violations').insert([{
      name: form.name.value,
      school_id: form.schoolId.value,
      grade: form.grade.value,
      section: form.section.value,
      violation_types: violationTypes, // Store as a string
      remarks: form.remarks.value
    }]);
  
    if (error) console.error('Error adding violation:', error);
    else {
      form.reset();
      formContainer.classList.remove('visible');
      fetchViolations();
    }
  });

// Delete all records
deleteAllBtn.addEventListener('click', async () => {
  const { error } = await supabase.from('violations').delete().neq('id', 0);
  if (error) console.error('Error deleting records:', error);
  else fetchViolations();
});

// Update record (you can implement this as needed)
async function updateRecord(id) {
    const { data: record, error } = await supabase
      .from('violations')
      .select('*')
      .eq('id', id)
      .single();
  
    if (error) console.error('Error fetching record:', error);
    else {
      // Populate the form with the record data
      form.name.value = record.name;
      form.schoolId.value = record.school_id;
      form.grade.value = record.grade;
      form.section.value = record.section;
      form.remarks.value = record.remarks;
  
      // Split violation_types back into checkboxes
      const violationTypes = record.violation_types.split(', ');
      document.querySelectorAll('input[name="violation"]').forEach(cb => {
        cb.checked = violationTypes.includes(cb.value);
      });
  
      // Show the form
      formContainer.classList.add('visible');
  
      // Update the form submission to handle updates
      form.onsubmit = async (e) => {
        e.preventDefault();
        const updatedViolationTypes = Array.from(document.querySelectorAll('input[name="violation"]:checked'))
          .map(cb => cb.value)
          .join(', ');
  
        const { error: updateError } = await supabase
          .from('violations')
          .update({
            name: form.name.value,
            school_id: form.schoolId.value,
            grade: form.grade.value,
            section: form.section.value,
            violation_types: updatedViolationTypes,
            remarks: form.remarks.value
          })
          .eq('id', id);
  
        if (updateError) console.error('Error updating record:', updateError);
        else {
          form.reset();
          formContainer.classList.remove('visible');
          fetchViolations();
        }
      };
    }
  }

// Delete record
async function deleteRecord(id) {
  const { error } = await supabase.from('violations').delete().eq('id', id);
  if (error) console.error('Error deleting record:', error);
  else fetchViolations();
}

// Initial fetch
fetchViolations();