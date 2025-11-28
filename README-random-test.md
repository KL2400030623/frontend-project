Random feedback tester

This repository includes a small Node script to POST randomized feedback JSON to a backend endpoint.

Usage

1. Ensure you have Node.js installed (Node 12+ recommended).
2. Install dependencies (adds multipart parsing support):

   npm install

3. (Optional) Start the included test server to accept submissions locally:

   npm run start-server

   The server listens on port 3000 by default and will append received JSON to `logs/feedbacks.jsonl` and store uploaded files in `uploads/`.

4. Run the script with node (or use the npm helper):

   node scripts/send_random_feedback.js --url http://localhost:3000/feedback --count 50 --delay 100 --concurrency 1
   # or
   npm run send-random -- --url http://localhost:3000/feedback --count 50 --delay 100

   Multipart uploads

   The sender can also perform multipart/form-data uploads (attach a small generated sample file) by adding the `--multipart` flag:

      node scripts/send_random_feedback.js --url http://localhost:3000/feedback --count 20 --multipart

   This will POST form fields and a small sample file named `sample.txt` for each submission.

Options

--url        The endpoint to POST to. Defaults to http://localhost:3000/feedback
--count      Number of randomized submissions to send (default 10)
--delay      Milliseconds delay multiplier between scheduled sends (default 200)
--concurrency Not used in this simple script (planned), keep 1

Notes

- The script sends JSON payloads (not multipart file uploads). It includes a `file` field with metadata in ~30% of generated entries but doesn't upload binary files.
- No external npm packages are required.
- If you want multi-threaded/concurrent loads, consider adding a small concurrency manager or using tools like `wrk`, `ab`, or `k6`.
