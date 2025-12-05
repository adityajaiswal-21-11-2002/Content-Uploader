const { connectToDatabase } = require("../lib/db")

async function updateRoles() {
  try {
    console.log("🔄 Checking and updating employee roles from 'peeper' to 'pepper'...")

    const db = await connectToDatabase()

    // Check current roles
    const employees = await db.collection("employees").find({}).toArray()
    console.log("📊 Current employees and roles:")
    employees.forEach(emp => {
      console.log(`  - ${emp.name}: ${emp.role}`)
    })

    // Update any "peeper" roles to "pepper"
    const result = await db.collection("employees").updateMany(
      { role: "peeper" },
      { $set: { role: "pepper" } }
    )

    if (result.modifiedCount > 0) {
      console.log(`✅ Updated ${result.modifiedCount} employee roles from 'peeper' to 'pepper'`)
    } else {
      console.log("ℹ️  No employees with 'peeper' role found - all roles are already 'pepper'")
    }

    // Verify the update
    const updatedEmployees = await db.collection("employees").find({}).toArray()
    console.log("📊 Updated employees and roles:")
    updatedEmployees.forEach(emp => {
      console.log(`  - ${emp.name}: ${emp.role}`)
    })

    console.log("🎉 Role update check complete!")

  } catch (error) {
    console.error("❌ Error updating roles:", error)
  } finally {
    process.exit(0)
  }
}

updateRoles()
