/**
 * CampusConnect - "The Quad" Campus Social Feed
 * Implements Graph Adjacency Filtering (Campus-wide vs 1st-Degree Friends vs 2-Hop Network)
 */

export class QuadFeed {
  /**
   * @param {Graph} graph 
   * @param {string} currentUserId 
   * @param {Array} initialPosts 
   * @param {Object} callbacks 
   */
  constructor(graph, currentUserId, initialPosts = [], callbacks = {}) {
    this.graph = graph;
    this.currentUserId = String(currentUserId);
    this.posts = [...initialPosts];
    this.callbacks = callbacks;
    this.currentFilter = "campus"; // "campus" | "friends" | "2hop"
    this.activeTag = null;
  }

  setCurrentUser(userId) {
    this.currentUserId = String(userId);
  }

  setFilter(filterType) {
    this.currentFilter = filterType;
  }

  setTagFilter(tag) {
    this.activeTag = tag;
  }

  clearTagFilter() {
    this.activeTag = null;
  }

  /**
   * Add a new post to the feed
   */
  createPost(content, tags = []) {
    const author = this.graph.getStudent(this.currentUserId);
    if (!author) return null;

    const newPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      authorId: this.currentUserId,
      timestamp: "Just now",
      content: content.trim(),
      tags: tags.map(t => t.startsWith("#") ? t : `#${t}`),
      likes: 0,
      likedBy: [],
      comments: []
    };

    this.posts.unshift(newPost);
    return newPost;
  }

  /**
   * Toggle like on a post
   */
  toggleLike(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;

    const idx = post.likedBy.indexOf(this.currentUserId);
    if (idx === -1) {
      post.likedBy.push(this.currentUserId);
      post.likes++;
    } else {
      post.likedBy.splice(idx, 1);
      post.likes = Math.max(0, post.likes - 1);
    }
    return true;
  }

  /**
   * Add a comment to a post
   */
  addComment(postId, commentText) {
    const post = this.posts.find(p => p.id === postId);
    if (!post || !commentText.trim()) return null;

    const comment = {
      authorId: this.currentUserId,
      text: commentText.trim(),
      timestamp: "Just now"
    };

    post.comments.push(comment);
    return comment;
  }

  /**
   * Get filtered posts based on Graph Adjacency Filter & active tags
   */
  getFilteredPosts() {
    const directFriends = this.graph.getNeighbors(this.currentUserId);

    // Compute 2-hop set if needed
    let twoHopSet = null;
    if (this.currentFilter === "2hop") {
      twoHopSet = new Set(directFriends);
      twoHopSet.add(this.currentUserId); // include own posts
      for (const friendId of directFriends) {
        for (const neighbor of this.graph.getNeighbors(friendId)) {
          twoHopSet.add(neighbor);
        }
      }
    }

    return this.posts.filter(post => {
      // 1. Tag filter
      if (this.activeTag && !post.tags.includes(this.activeTag)) {
        return false;
      }

      // 2. Adjacency filter
      if (this.currentFilter === "campus") {
        return true;
      } else if (this.currentFilter === "friends") {
        // Direct friends + author's own posts
        return post.authorId === this.currentUserId || directFriends.has(post.authorId);
      } else if (this.currentFilter === "2hop") {
        return twoHopSet ? twoHopSet.has(post.authorId) : true;
      }
      return true;
    });
  }

  /**
   * Get all popular hashtags across all posts
   */
  getAllTags() {
    const tagCount = new Map();
    for (const post of this.posts) {
      for (const tag of post.tags) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
    }
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }
}
