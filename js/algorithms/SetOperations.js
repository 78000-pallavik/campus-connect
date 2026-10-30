/**
 * CampusConnect - Set Operations Engine
 * Calculates common friends via Set Intersection with O(min(deg(A), deg(B))) optimization
 * Calculates shared clubs, dorms, skills, and Jaccard Similarity index
 */

export class SetOperations {
  /**
   * Find mutual 1st-degree friends between student A and student B
   * Time Complexity: O(min(deg(A), deg(B)))
   * Space Complexity: O(min(deg(A), deg(B)))
   * @param {Graph} graph 
   * @param {string} studentAId 
   * @param {string} studentBId 
   */
  static findMutualFriends(graph, studentAId, studentBId) {
    studentAId = String(studentAId);
    studentBId = String(studentBId);

    const studentA = graph.getStudent(studentAId);
    const studentB = graph.getStudent(studentBId);

    if (!studentA || !studentB) {
      return {
        mutualFriends: [],
        count: 0,
        jaccardIndex: 0,
        sharedClubs: [],
        sameDorm: false,
        sameMajor: false,
        sharedSkills: [],
        benchmarks: { smallerDegree: 0, largerDegree: 0, comparisonsMade: 0 }
      };
    }

    const setA = graph.getNeighbors(studentAId);
    const setB = graph.getNeighbors(studentBId);

    // Optimize iteration by choosing smaller set
    const smallerSet = setA.size <= setB.size ? setA : setB;
    const largerSet = setA.size <= setB.size ? setB : setA;

    const mutualIds = [];
    let comparisonsMade = 0;

    for (const friendId of smallerSet) {
      comparisonsMade++;
      if (largerSet.has(friendId)) {
        mutualIds.push(friendId);
      }
    }

    const mutualStudents = mutualIds.map(id => graph.getStudent(id)).filter(Boolean);

    // Calculate Jaccard Similarity for friendships: |A ∩ B| / |A ∪ B|
    const unionSize = (setA.size + setB.size) - mutualIds.length;
    const jaccardIndex = unionSize > 0 ? (mutualIds.length / unionSize).toFixed(3) : "0.000";

    // Set Intersection for Clubs
    const clubsA = new Set(studentA.clubs || []);
    const sharedClubs = (studentB.clubs || []).filter(c => clubsA.has(c));

    // Shared Dorm
    const sameDorm = Boolean(studentA.dorm && studentB.dorm && studentA.dorm === studentB.dorm);

    // Shared Major
    const sameMajor = Boolean(studentA.major && studentB.major && studentA.major === studentB.major);

    // Set Intersection for Skills
    const skillsA = new Set(studentA.skills || []);
    const sharedSkills = (studentB.skills || []).filter(s => skillsA.has(s));

    return {
      studentA,
      studentB,
      mutualFriends: mutualStudents,
      mutualFriendIds: mutualIds,
      count: mutualStudents.length,
      jaccardIndex: Number(jaccardIndex),
      sharedClubs,
      sameDorm,
      dormName: sameDorm ? studentA.dorm : null,
      sameMajor,
      majorName: sameMajor ? studentA.major : null,
      sharedSkills,
      benchmarks: {
        degA: setA.size,
        degB: setB.size,
        smallerDegree: smallerSet.size,
        largerDegree: largerSet.size,
        comparisonsMade,
        theoreticalMax: Math.min(setA.size, setB.size)
      }
    };
  }

  /**
   * Fast Set Union of friends
   */
  static unionFriends(graph, studentAId, studentBId) {
    const setA = graph.getNeighbors(studentAId);
    const setB = graph.getNeighbors(studentBId);
    const union = new Set([...setA, ...setB]);
    return Array.from(union).map(id => graph.getStudent(id)).filter(Boolean);
  }
}
