/**
 * Airtable Scripting App Script
 * 
 * Run this script in Airtable Scripting environment to create the "User Preferences" table
 * 
 * Instructions:
 * 1. Open your System configuration base in Airtable
 * 2. Go to Extensions → Scripting
 * 3. Create a new script
 * 4. Paste this code
 * 5. Run the script
 */

const tableName = "User Preferences";

// Check if table already exists
const baseTables = base.tables.map(t => t.name);

if (baseTables.includes(tableName)) {
  output.markdown(`✅ Table **${tableName}** already exists.`);
  output.markdown(`\nTo recreate it, delete the existing table first.`);
} else {
  output.markdown(`🔧 Creating table **${tableName}**...`);
  
  try {
    const tbl = await base.createTableAsync(tableName, [
      { name: "User Id", type: "singleLineText" },
      { 
        name: "Namespace", 
        type: "singleSelect", 
        options: { 
          choices: [
            { name: "ui" }, 
            { name: "table" }, 
            { name: "filters" }, 
            { name: "featureFlags" }, 
            { name: "misc" }
          ] 
        } 
      },
      { name: "Key", type: "singleLineText" },
      { name: "Table Id", type: "singleLineText" },
      { name: "Scope Id", type: "singleLineText" },
      { 
        name: "Type", 
        type: "singleSelect", 
        options: { 
          choices: [
            { name: "string" }, 
            { name: "number" }, 
            { name: "boolean" }, 
            { name: "json" }
          ] 
        } 
      },
      { name: "Value (text)", type: "multilineText" },
      { name: "Value (number)", type: "number", options: { precision: 3 } },
      { 
        name: "Value (boolean)", 
        type: "checkbox", 
        options: { color: "greenBright", icon: "check" } 
      },
      { 
        name: "Visibility", 
        type: "singleSelect", 
        options: { 
          choices: [
            { name: "private" }, 
            { name: "org" }, 
            { name: "global" }
          ] 
        } 
      },
      { 
        name: "Expires At", 
        type: "dateTime", 
        options: { 
          timeZone: "utc", 
          dateFormat: { name: "iso" }, 
          timeFormat: { name: "24hour" } 
        } 
      },
      // Temporary placeholder fields (will be converted to formulas)
      { name: "Unique Key", type: "singleLineText" },
      { name: "Created At", type: "createdTime" },
      { name: "Last Modified", type: "lastModifiedTime" },
      { name: "Checksum", type: "singleLineText" },
    ]);

    output.markdown(`✅ Table **${tableName}** created with basic fields.`);
    output.markdown(`\n⚠️  **Next Steps:**`);
    output.markdown(`\n1. Convert "Unique Key" to formula field:`);
    output.markdown(`   Formula: \`CONCATENATE({User Id}, '::', {Namespace}, '::', IF({Table Id}, {Table Id}, ''), '::', IF({Scope Id}, {Scope Id}, ''), '::', {Key})\``);
    output.markdown(`\n2. Convert "Checksum" to formula field (optional):`);
    output.markdown(`   Formula: \`SHA256(CONCATENATE({Type}, '::', IF({Value (text)}, {Value (text)}, ''), '::', IF({Value (number)}, {Value (number)}, ''), '::', IF({Value (boolean)}, 'true', 'false')))\``);
    output.markdown(`\n3. Set "User Id" and "Key" fields as required`);
    output.markdown(`\n4. Set default value for "Visibility" to "private"`);
    
    // Try to update formula fields programmatically (may not work in all Airtable versions)
    try {
      await tbl.updateFieldsAsync([
        {
          id: tbl.getField("Unique Key").id,
          type: "formula",
          options: { 
            formula: "CONCATENATE({User Id}, '::', {Namespace}, '::', IF({Table Id}, {Table Id}, ''), '::', IF({Scope Id}, {Scope Id}, ''), '::', {Key})" 
          }
        },
        {
          id: tbl.getField("Checksum").id,
          type: "formula",
          options: { 
            formula: "SHA256(CONCATENATE({Type}, '::', IF({Value (text)}, {Value (text)}, ''), '::', IF({Value (number)}, {Value (number)}, ''), '::', IF({Value (boolean)}, 'true', 'false')))" 
          }
        }
      ]);
      output.markdown(`\n✅ Formula fields updated successfully!`);
    } catch (formulaError) {
      output.markdown(`\n⚠️  Could not update formula fields programmatically. Please update them manually in the Airtable UI.`);
      output.markdown(`\nError: ${formulaError.message}`);
    }
    
  } catch (error) {
    output.markdown(`\n❌ Error creating table: ${error.message}`);
    output.markdown(`\nPlease check:`);
    output.markdown(`- You have permission to create tables in this base`);
    output.markdown(`- The base is the System configuration base`);
    output.markdown(`- All required fields are valid`);
  }
}

