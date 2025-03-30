// Central configuration file for team settings

// Full team name (e.g. "Golden State Warriors")
export const TEAM_NAME = "Golden State Warriors"

// Team abbreviation (e.g. "GSW" or "LAL")
export const TEAM_ABBR = "GSW"

// Season ID
export const SEASON_ID = "22021"

// Helper function to get team search pattern for MATCHUP field
// This handles both home and away games (e.g., "GSW" and "@GSW")
export const getTeamMatchupPattern = () => {
  return TEAM_ABBR
}
