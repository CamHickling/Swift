import type { WorkoutRecord, WorkoutSample } from '../types/workout';

/**
 * Generate TCX (Training Center XML) file from workout data
 * TCX is widely supported by Strava, Garmin Connect, etc.
 */
export function generateTCX(workout: WorkoutRecord): string {
  const startTime = new Date(workout.startTime).toISOString();
  const totalTimeSeconds = workout.summary.duration;
  const distanceMeters = workout.summary.distance * 1000;
  const calories = estimateCalories(workout.summary.avgPower, workout.summary.duration);

  let trackpoints = '';
  workout.samples.forEach((sample) => {
    trackpoints += generateTrackpoint(sample, workout.startTime);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Activities>
    <Activity Sport="Biking">
      <Id>${startTime}</Id>
      <Lap StartTime="${startTime}">
        <TotalTimeSeconds>${totalTimeSeconds}</TotalTimeSeconds>
        <DistanceMeters>${distanceMeters.toFixed(1)}</DistanceMeters>
        <Calories>${calories}</Calories>
        <AverageHeartRateBpm>${workout.summary.avgHeartRate ? `<Value>${Math.round(workout.summary.avgHeartRate)}</Value>` : ''}</AverageHeartRateBpm>
        <MaximumHeartRateBpm>${workout.summary.maxHeartRate ? `<Value>${Math.round(workout.summary.maxHeartRate)}</Value>` : ''}</MaximumHeartRateBpm>
        <Intensity>Active</Intensity>
        <Cadence>${Math.round(workout.summary.avgCadence)}</Cadence>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
${trackpoints}        </Track>
        <Extensions>
          <ns3:LX xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
            <ns3:AvgWatts>${Math.round(workout.summary.avgPower)}</ns3:AvgWatts>
            <ns3:MaxWatts>${Math.round(workout.summary.maxPower)}</ns3:MaxWatts>
          </ns3:LX>
        </Extensions>
      </Lap>
      <Creator xsi:type="Device_t">
        <Name>Swift Indoor Cycling</Name>
        <UnitId>0</UnitId>
        <ProductID>0</ProductID>
      </Creator>
    </Activity>
  </Activities>
  <Author xsi:type="Application_t">
    <Name>Swift</Name>
    <Build>
      <Version>
        <VersionMajor>1</VersionMajor>
        <VersionMinor>0</VersionMinor>
      </Version>
    </Build>
    <LangID>en</LangID>
    <PartNumber>000-00000-00</PartNumber>
  </Author>
</TrainingCenterDatabase>`;
}

function generateTrackpoint(sample: WorkoutSample, workoutStartTime: number): string {
  const time = new Date(sample.timestamp).toISOString();
  // Calculate cumulative distance based on speed (km/h) and time elapsed
  const elapsedHours = (sample.timestamp - workoutStartTime) / 3600000;
  const distanceMeters = sample.speed * elapsedHours * 1000;

  let heartRateXml = '';
  if (sample.heartRate) {
    heartRateXml = `
          <HeartRateBpm>
            <Value>${sample.heartRate}</Value>
          </HeartRateBpm>`;
  }

  return `          <Trackpoint>
            <Time>${time}</Time>
            <DistanceMeters>${distanceMeters.toFixed(1)}</DistanceMeters>${heartRateXml}
            <Cadence>${Math.round(sample.cadence)}</Cadence>
            <Extensions>
              <ns3:TPX xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
                <ns3:Watts>${sample.power}</ns3:Watts>
              </ns3:TPX>
            </Extensions>
          </Trackpoint>
`;
}

/**
 * Estimate calories burned based on average power and duration
 * Rough estimate: 1 kJ = 1 calorie (actually 1 kcal = 4.184 kJ, but ~25% efficiency)
 */
function estimateCalories(avgPower: number, durationSeconds: number): number {
  // Power (watts) * time (seconds) = energy (joules)
  // Convert to kJ and use as calorie estimate
  const kilojoules = (avgPower * durationSeconds) / 1000;
  return Math.round(kilojoules);
}

/**
 * Download TCX file to user's computer
 */
export function downloadTCX(workout: WorkoutRecord): void {
  const tcxContent = generateTCX(workout);
  const blob = new Blob([tcxContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${workout.name.replace(/[^a-z0-9]/gi, '_')}_${new Date(workout.startTime).toISOString().split('T')[0]}.tcx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
