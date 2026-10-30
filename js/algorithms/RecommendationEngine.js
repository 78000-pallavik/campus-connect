/**
 * CampusConnect - Friend Recommendation Engine ("People You May Know")
 * Explores 2-Hop BFS Neighbors (Friends of Friends)
 * Weighted Relevance Score Formula:
 * Score = (Mutual Friends * 3.5) + (Same Major ? 2.5 : 0) + (Same Dorm ? 2.0 : 0) + (Shared Clubs * 1.5)
 */

export class RecommendationEngine {
  /**
   * Compute ranked 2-hop recommendations for a given student
   * @param {Graph} graph 
   * @param {string} studentId 
   * @returns {Array<Object>} Ranked candidates
   */
  static getRecommendations(graph, studentId) {
    studentId = String(studentId);
    const targetStudent = graph.getStudent(studentId);
    if (!targetStudent) return [];

    const directFriends = graph.getNeighbors(studentId);
    // Candidates at 2-hop distance (neighbors of direct friends)
    const candidatesMap = new Map(); // candidateId -> { mutualFriends: Set }

    for (const friendId of directFriends) {
      const secondHopNeighbors = graph.getNeighbors(friendId);
      for (const candidateId of secondHopNeighbors) {
        // Exclude self and direct friends
        if (candidateId === studentId || directFriends.has(candidateId)) {
          continue;
        }

        if (!candidatesMap.has(candidateId)) {
          candidatesMap.set(candidateId, new Set());
        }
        candidatesMap.get(candidateId).add(friendId);
      }
    }

    const recommendations = [];

    for (const [candidateId, mutualSet] of candidatesMap.entries()) {
      const candidateStudent = graph.getStudent(candidateId);
      if (!candidateStudent) continue;

      const mutualCount = mutualSet.size;
      const sameMajor = targetStudent.major && candidateStudent.major && targetStudent.major === candidateStudent.major;
      const sameDorm = targetStudent.dorm && candidateStudent.dorm && targetStudent.dorm === candidateStudent.dorm;

      // Shared clubs set intersection
      const targetClubs = new Set(targetStudent.clubs || []);
      const sharedClubs = (candidateStudent.clubs || []).filter(c => targetClubs.has(c));

      // Calculate score according to PRD specification
      const mutualFriendsScore = mutualCount * 3.5;
      const majorScore = sameMajor ? 2.5 : 0;
      const dormScore = sameDorm ? 2.0 : 0;
      const clubScore = sharedClubs.length * 1.5;

      const totalScore = Number((mutualFriendsScore + majorScore + dormScore + clubScore).toFixed(1));

      // Mutual friends objects
      const mutualFriendsList = Array.from(mutualSet).map(id => graph.getStudent(id)).filter(Boolean);

      recommendations.push({
        candidate: candidateStudent,
        score: totalScore,
        breakdown: {
          mutualFriends: {
            count: mutualCount,
            score: mutualFriendsScore,
            list: mutualFriendsList
          },
          sameMajor: {
            isSame: sameMajor,
            score: majorScore,
            major: candidateStudent.major
          },
          sameDorm: {
            isSame: sameDorm,
            score: dormScore,
            dorm: candidateStudent.dorm
          },
          sharedClubs: {
            count: sharedClubs.length,
            score: clubScore,
            list: sharedClubs
          }
        },
        reasons: [
          mutualCount > 0 ? `${mutualCount} mutual friend${mutualCount > 1 ? "s" : ""} (+${mutualFriendsScore})` : null,
          sameMajor ? `Same Major: ${candidateStudent.major} (+2.5)` : null,
          sameDorm ? `Same Dorm: ${candidateStudent.dorm} (+2.0)` : null,
          sharedClubs.length > 0 ? `${sharedClubs.length} shared club${sharedClubs.length > 1 ? "s" : ""} (+${clubScore})` : null
        ].filter(Boolean)
      });
    }

    // Sort descending by relevance score
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations;
  }
}
