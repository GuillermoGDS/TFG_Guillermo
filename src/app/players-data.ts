export type PlayerStats = {
    ppg: number
    fg_percentage: string
    three_point_percentage: string
    ft_percentage: string
    total_rebounds: number
    offensive_rebounds: number
    defensive_rebounds: number
    apg: number
    spg: number
    bpg: number
    turnovers: number
    fouls: number
  }
  
  export type AdvancedStats = {
    per: number
    plus_minus: string
    usg_percentage: string
    ts_percentage: string
    ast_to_ratio: number
    win_shares: number
    off_rtg: number
    def_rtg: number
    net_rtg: string
    possessions: number
    ppp: number
  }
  
  export type PlayerData = {
    name: string
    image: string
    position: string
    stats: PlayerStats
    advancedStats: AdvancedStats
    heatmap: string
  }
  
  export const playersData: Record<string, PlayerData> = {
    "2544": {
      name: "LeBron James",
      image: "/lebron-james.png",
      position: "SF",
      stats: {
        ppg: 2888888.2,
        fg_percentage: "70.4%",
        three_point_percentage: "34.6%",
        ft_percentage: "73.4%",
        total_rebounds: 700000000.4,
        offensive_rebounds: 1.2,
        defensive_rebounds: 6.2,
        apg: 7.2,
        spg: 1.5,
        bpg: 0.8,
        turnovers: 3.1,
        fouls: 2.4,
      },
      advancedStats: {
        per: 27.5,
        plus_minus: "+6.8",
        usg_percentage: "31.2%",
        ts_percentage: "61.9%",
        ast_to_ratio: 2.5,
        win_shares: 12.3,
        off_rtg: 116.4,
        def_rtg: 108.2,
        net_rtg: "+8.2",
        possessions: 99.8,
        ppp: 1.18,
      },
      heatmap: "/lebron.webp",
    },

    //GOLDEN STATE WARRIORS
    "201939": {
      name: "Stephen Curry",
      image: "/stephen-curry.png",
      position: "PG",
      stats: {
        ppg: 30.1,
        fg_percentage: "48.7%",
        three_point_percentage: "42.3%",
        ft_percentage: "91.6%",
        total_rebounds: 5.5,
        offensive_rebounds: 0.6,
        defensive_rebounds: 4.9,
        apg: 6.3,
        spg: 1.4,
        bpg: 0.4,
        turnovers: 3.2,
        fouls: 2.2,
      },
      advancedStats: {
        per: 26.9,
        plus_minus: "+7.5",
        usg_percentage: "30.1%",
        ts_percentage: "64.2%",
        ast_to_ratio: 2.1,
        win_shares: 11.7,
        off_rtg: 118.2,
        def_rtg: 109.5,
        net_rtg: "+8.7",
        possessions: 101.3,
        ppp: 1.22,
      },
      heatmap: "/heatmaps/curry.png",
    },

    "1626172": {
      name: "Kevon Looney",
      image: "/kevon-looney.png",
      position: "PG",
      stats: {
        ppg: 30.1,
        fg_percentage: "48.7%",
        three_point_percentage: "42.3%",
        ft_percentage: "91.6%",
        total_rebounds: 5.5,
        offensive_rebounds: 0.6,
        defensive_rebounds: 4.9,
        apg: 6.3,
        spg: 1.4,
        bpg: 0.4,
        turnovers: 3.2,
        fouls: 2.2,
      },
      advancedStats: {
        per: 26.9,
        plus_minus: "+7.5",
        usg_percentage: "30.1%",
        ts_percentage: "64.2%",
        ast_to_ratio: 2.1,
        win_shares: 11.7,
        off_rtg: 118.2,
        def_rtg: 109.5,
        net_rtg: "+8.7",
        possessions: 101.3,
        ppp: 1.22,
      },
      heatmap: "/heatmaps/curry.png",
    },

    "1627780": {
      name: "Gary Payton II",
      image: "/gary-payton-II.png",
      position: "PG",
      stats: {
        ppg: 30.1,
        fg_percentage: "48.7%",
        three_point_percentage: "42.3%",
        ft_percentage: "91.6%",
        total_rebounds: 5.5,
        offensive_rebounds: 0.6,
        defensive_rebounds: 4.9,
        apg: 6.3,
        spg: 1.4,
        bpg: 0.4,
        turnovers: 3.2,
        fouls: 2.2,
      },
      advancedStats: {
        per: 26.9,
        plus_minus: "+7.5",
        usg_percentage: "30.1%",
        ts_percentage: "64.2%",
        ast_to_ratio: 2.1,
        win_shares: 11.7,
        off_rtg: 118.2,
        def_rtg: 109.5,
        net_rtg: "+8.7",
        possessions: 101.3,
        ppp: 1.22,
      },
      heatmap: "/heatmaps/curry.png",
    },

    "1627814": {
      name: "Damion Lee",
      image: "/damion-lee.png",
      position: "PG",
      stats: {
        ppg: 30.1,
        fg_percentage: "48.7%",
        three_point_percentage: "42.3%",
        ft_percentage: "91.6%",
        total_rebounds: 5.5,
        offensive_rebounds: 0.6,
        defensive_rebounds: 4.9,
        apg: 6.3,
        spg: 1.4,
        bpg: 0.4,
        turnovers: 3.2,
        fouls: 2.2,
      },
      advancedStats: {
        per: 26.9,
        plus_minus: "+7.5",
        usg_percentage: "30.1%",
        ts_percentage: "64.2%",
        ast_to_ratio: 2.1,
        win_shares: 11.7,
        off_rtg: 118.2,
        def_rtg: 109.5,
        net_rtg: "+8.7",
        possessions: 101.3,
        ppp: 1.22,
      },
      heatmap: "/heatmaps/curry.png",
    },
    
    
    

    "kevin-durant": {
      name: "Kevin Durant",
      image: "/kevin-durant.png",
      position: "SF",
      stats: {
        ppg: 27.0,
        fg_percentage: "53.7%",
        three_point_percentage: "38.5%",
        ft_percentage: "88.4%",
        total_rebounds: 7.1,
        offensive_rebounds: 1.0,
        defensive_rebounds: 6.1,
        apg: 4.5,
        spg: 0.9,
        bpg: 1.1,
        turnovers: 3.0,
        fouls: 2.3,
      },
      advancedStats: {
        per: 26.1,
        plus_minus: "+5.3",
        usg_percentage: "28.9%",
        ts_percentage: "60.4%",
        ast_to_ratio: 2.4,
        win_shares: 9.8,
        off_rtg: 114.0,
        def_rtg: 106.7,
        net_rtg: "+7.3",
        possessions: 98.1,
        ppp: 1.19,
      },
      heatmap: "/heatmaps/durant.png",
    },
    "luka-doncic": {
      name: "Luka Doncic",
      image: "/luka-doncic.png",
      position: "PG",
      stats: {
        ppg: 28.3,
        fg_percentage: "46.2%",
        three_point_percentage: "32.6%",
        ft_percentage: "75.0%",
        total_rebounds: 8.1,
        offensive_rebounds: 1.2,
        defensive_rebounds: 6.9,
        apg: 8.9,
        spg: 1.0,
        bpg: 0.5,
        turnovers: 4.2,
        fouls: 3.0,
      },
      advancedStats: {
        per: 27.6,
        plus_minus: "+7.0",
        usg_percentage: "32.1%",
        ts_percentage: "59.5%",
        ast_to_ratio: 2.0,
        win_shares: 10.3,
        off_rtg: 115.3,
        def_rtg: 106.9,
        net_rtg: "+8.4",
        possessions: 102.4,
        ppp: 1.21,
      },
      heatmap: "/heatmaps/doncic.png",
    },
    "giannis-antetokounmpo": {
      name: "Giannis Antetokounmpo",
      image: "/giannis-antetokounmpo.webp",
      position: "PF",
      stats: {
        ppg: 29.9,
        fg_percentage: "55.9%",
        three_point_percentage: "30.4%",
        ft_percentage: "68.5%",
        total_rebounds: 11.1,
        offensive_rebounds: 2.3,
        defensive_rebounds: 8.8,
        apg: 5.7,
        spg: 1.1,
        bpg: 1.0,
        turnovers: 3.6,
        fouls: 3.1,
      },
      advancedStats: {
        per: 29.7,
        plus_minus: "+9.0",
        usg_percentage: "33.5%",
        ts_percentage: "62.1%",
        ast_to_ratio: 1.6,
        win_shares: 15.1,
        off_rtg: 116.5,
        def_rtg: 103.3,
        net_rtg: "+13.2",
        possessions: 104.7,
        ppp: 1.23,
      },
      heatmap: "/heatmaps/giannis.png",
    },
    "nikola-jokic": {
      name: "Nikola Jokic",
      image: "/nikola-jokic.jpg",
      position: "C",
      stats: {
        ppg: 26.4,
        fg_percentage: "56.6%",
        three_point_percentage: "35.0%",
        ft_percentage: "85.5%",
        total_rebounds: 10.8,
        offensive_rebounds: 1.5,
        defensive_rebounds: 9.3,
        apg: 8.4,
        spg: 1.3,
        bpg: 0.7,
        turnovers: 3.4,
        fouls: 2.6,
      },
      advancedStats: {
        per: 30.4,
        plus_minus: "+9.2",
        usg_percentage: "28.3%",
        ts_percentage: "65.7%",
        ast_to_ratio: 3.1,
        win_shares: 13.2,
        off_rtg: 118.3,
        def_rtg: 107.5,
        net_rtg: "+10.8",
        possessions: 102.2,
        ppp: 1.20,
      },
      heatmap: "/heatmaps/jokic.png",
    },
  }
  