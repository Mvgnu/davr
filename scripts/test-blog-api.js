#!/usr/bin/env node

/**
 * Test script for the blog API
 * 
 * This script tests various filter combinations to ensure the API
 * responds correctly with the expected data.
 */

// Simple script to test the blog API with different filters

// Node.js 18+ comes with built-in fetch
// import fetch from 'node:fetch';

// Base URL - update this to match your environment
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/blog`;

/**
 * Test the blog API with various filter combinations
 */
async function testBlogAPI() {
  console.log('🧪 Starting Blog API Test');
  console.log('========================');
  
  // Test cases with different filter combinations
  const testCases = [
    { 
      name: 'Default (no filters)', 
      params: {} 
    },
    { 
      name: 'Search Filter', 
      params: { search: 'aluminum' } 
    },
    { 
      name: 'Category Filter', 
      params: { category: 'recycling' } 
    },
    { 
      name: 'Sort by oldest', 
      params: { sort: 'oldest' } 
    },
    { 
      name: 'Sort by A-Z', 
      params: { sort: 'az' } 
    },
    { 
      name: 'Pagination - Page 1, Limit 5', 
      params: { page: 1, limit: 5 } 
    },
    { 
      name: 'Combined Filters', 
      params: { 
        search: 'aluminum', 
        category: 'recycling', 
        sort: 'newest', 
        page: 1, 
        limit: 10 
      } 
    }
  ];
  
  // Run each test case
  for (const testCase of testCases) {
    try {
      console.log(`\n📋 Test: ${testCase.name}`);
      console.log('------------------');
      
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(testCase.params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      
      const url = `${API_URL}?${queryParams.toString()}`;
      console.log(`🔗 URL: ${url}`);
      
      // Make the request
      console.log('⏳ Sending request...');
      const startTime = Date.now();
      const response = await fetch(url);
      const endTime = Date.now();
      
      // Get response
      const data = await response.json();
      
      // Display results
      console.log(`⏱️ Response time: ${endTime - startTime}ms`);
      console.log(`🟢 Status: ${response.status} ${response.statusText}`);
      
      if (data.success) {
        const { posts, pagination } = data.data;
        console.log(`📊 Results: ${posts.length} posts (total: ${pagination.total})`);
        console.log(`📄 Pages: ${pagination.currentPage} of ${pagination.totalPages}`);
        
        // Show post titles
        if (posts.length > 0) {
          console.log('\n📑 Articles found:');
          posts.forEach((post, index) => {
            console.log(`   ${index + 1}. ${post.title}`);
          });
        } else {
          console.log('❌ No articles found matching criteria');
        }
      } else {
        console.log(`❌ Error: ${data.message}`);
        if (data.details) {
          console.log(`   Details: ${data.details}`);
        }
      }
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }
  
  console.log('\n========================');
  console.log('🏁 Blog API Test Completed');
}

// Run the tests
testBlogAPI().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 