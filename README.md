# Graham

An AI-powered SDR automation platform with lead detection, email outreach, and analytics.

## Features

- 🤖 AI-powered lead detection and enrichment
- 📧 Automated email outreach with A/B testing
- 📊 Advanced analytics and reporting
- 👥 Team collaboration features
- 🔄 CRM and calendar integrations
- 🔍 LinkedIn integration for lead research
- 📈 Custom sequences and campaigns
- 🎯 Lead scoring and prioritization


user signs up -> webhook to add the user to the enrichment queue -> worker picks up job and enriches the lead and then customizes an email to send them -> sends slack message to the biz to show them what email they are about to send -> approve and send the email

- can see the information that the agent fetched from the internet in the dashboard 

-> sends a detailed briefing for the sales call etc

-> can see the sales call transcript in the dashboard

-> can see the email that was sent in the dashboard


enrichment tools
- start with browserbase google search, if the person is not found then do next steps
    - can use google dorking for specialized search queries 

- apollo.io for person enrichment
    - get the person's name and return email confirmed companies linkedin etc
    - get the top 5 and then search from there

- exa labs (linkedin semantic search)
    - search for the person's name and return the top 5 results
    - match with apollo.io to find common matches and pinpoint user 

* if the user registers with their company email we can easily pinpoint who it is and might not even need to do both searches

- searching twitter for their name/potential posts with the company 
    - done with browserbase and stagehand

