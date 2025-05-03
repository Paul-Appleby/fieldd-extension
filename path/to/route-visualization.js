// Update the path definition to match the curved route
const path = `M ${startX} ${startY}
  L ${startX + 20} ${startY + 100}
  L ${startX - 40} ${startY + 150}
  L ${startX - 40} ${startY + 200}
  L ${startX + 100} ${startY + 200}
  L ${startX + 150} ${startY + 250}
  L ${endX} ${endY}`;

// Update the path element
pathElement.setAttribute('d', path);

// Add a continuous background line
const backgroundLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
backgroundLine.setAttribute("stroke", "#e6f3ff");
backgroundLine.setAttribute("stroke-width", "2");
backgroundLine.setAttribute("fill", "none");
backgroundLine.setAttribute("d", path);
svg.insertBefore(backgroundLine, dots[0]); // Add before dots so it's in background

// Adjust dot spacing and quantity
const numberOfDots = 8; // Increase number of dots
const dotSpacing = 1 / numberOfDots;

dots.forEach((dot, index) => {
  dot.style.r = "4"; // Slightly larger dots
  // Adjust spacing to be more frequent
  dot.animate.setAttribute("dur", "3s");
  dot.animate.setAttribute("keyPoints", `${index * dotSpacing}; ${(index * dotSpacing + 1) % 1}`);
});

class RouteVisualization {
  constructor() {
    this.maxJobs = 4; // Increase maximum jobs to 4
    this.selectedJobs = [];
    this.paths = [];
  }

  addJob(job) {
    if (this.selectedJobs.length < this.maxJobs) {
      this.selectedJobs.push(job);
      this.updateVisualization();
      return true;
    }
    return false;
  }

  updateVisualization() {
    // Clear existing paths
    this.clearPaths();
    
    // Create paths between consecutive jobs
    for (let i = 0; i < this.selectedJobs.length - 1; i++) {
      const startJob = this.selectedJobs[i];
      const endJob = this.selectedJobs[i + 1];
      this.createPathBetweenJobs(startJob, endJob, i);
    }
  }

  createPathBetweenJobs(startJob, endJob, pathIndex) {
    // Create path with unique color based on index
    const colors = ['#0066FF', '#00CC66', '#FF6600']; // Different colors for each segment
    const pathColor = colors[pathIndex % colors.length];
    
    // Create path and dots...
    // ... existing path creation code ...
  }
}

// Update the UI to show selected job count
function updateJobCounter() {
  const counter = document.querySelector('.job-counter');
  counter.textContent = `${routeViz.selectedJobs.length}/4 Jobs Selected`;
} 