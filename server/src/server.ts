import "dotenv/config";
import express from "express"
import { db } from "./db"
import { customers } from "./db/schema/customers"
import { logger } from "./utils/logger";
import { httpLogger } from "./utils/httpLogger";

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(httpLogger)

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

app.get("/test-db", async (req, res) => {
  try {
    const result = await db.select().from(customers)
    res.json(result)
  } catch (error) {
   req.log.error(error, "Database query failed")
    res.status(500).json({ error: "Database error" })
  }
})

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});
