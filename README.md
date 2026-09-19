# Insight Engine

Build a professional, interactive web-based prototype called “Visual Inspection & Defect Root-Cause Assistant” for a high-throughput manufacturing environment.

The system should be a unified decision-support dashboard rather than just a defect classifier. The main workflow should connect Defect Detection → Defect Localization → Confidence/Uncertainty → Process & Batch Analysis → Bottleneck Detection → Throughput/Loss Analysis → Economic Impact → Investigation Recommendation.

Create a modern industrial dashboard where a quality/process engineer can upload or select an inspection image and see whether the product is Accepted, Defective, Requires Review, or a Potential Novel Defect. For defective products, display the defect category, confidence score, defect location using a bounding box/heatmap, batch information, and relevant evidence.

Add a Process & Root-Cause Analysis section showing relationships between defect patterns and process conditions such as batch, station, cycle time, downtime, changeover, utilization, and other available process variables. Clearly label these relationships as associations rather than proven causation.

Add a Production Bottleneck Dashboard that ranks constrained stations using cycle time, utilization, WIP, downtime, and changeover information. Show how the bottleneck affects production throughput.
Add an Economic Impact / What-if Simulator showing estimated scrap cost, rework cost, throughput loss, and margin impact. Provide Low, Base, and High scenarios and clearly indicate that these are simulated/advisory estimates.

Add an Evidence-Based Recommendations panel that ranks what the engineer should investigate next, with every recommendation linked back to the relevant defect, process evidence, bottleneck, and economic impact.

The dashboard should include KPI cards, defect trends, batch comparisons, process charts, bottleneck rankings, economic impact visualizations, inspection results, and an interactive workflow from a detected defect to its final recommendation.

Use a clean, professional industrial/enterprise UI, suitable for a hackathon judging demo. Make the prototype highly interactive with realistic sample data if actual datasets are unavailable. Include navigation such as Overview, Inspection, Root Cause, Bottlenecks, Economic Impact, and Recommendations.

The prototype should focus on demonstrating the complete “defect → evidence → process → bottleneck → loss → economic impact → recommendation” chain rather than pretending to have live factory hardware. All recommendations and economic calculations must remain simulated/advisory, consistent with the hackathon requirements.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://defect-sight-chain.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/51b755f3-964b-4871-a5ca-3953c7691246).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
