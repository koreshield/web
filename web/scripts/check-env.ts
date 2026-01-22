import "dotenv/config";

const requiredVars = [
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
];

console.log("Checking environment variables...");

const missing = [];
const present = [];

for (const key of requiredVars) {
    if (process.env[key]) {
        present.push(key);
    } else {
        missing.push(key);
    }
}

console.log("Present:", present.join(", "));
if (missing.length > 0) {
    console.error("Missing:", missing.join(", "));
    process.exit(1);
} else {
    console.log("All required variables are present.");
}
