import dbConnect from './db-connect';
import BlogPost from '../models/BlogPost';
import magazinSeedData from './magazin-data';
import readline from 'readline';

/**
 * Error types for seeding process
 */
const SeedErrorType = {
  CONNECTION_FAILED: 'Connection failed',
  QUERY_FAILED: 'Query failed',
  DELETION_FAILED: 'Deletion failed',
  INSERTION_FAILED: 'Insertion failed'
} as const;

type SeedErrorTypeValues = typeof SeedErrorType[keyof typeof SeedErrorType];

/**
 * Custom error class for seed operations
 */
class SeedError extends Error {
  constructor(type: SeedErrorTypeValues, message: string) {
    super(`${type}: ${message}`);
    this.name = 'SeedError';
  }
}

/**
 * Connects to the MongoDB database
 * @returns Promise that resolves when connection is established
 * @throws SeedError if connection fails
 */
async function connectToDatabase(): Promise<void> {
  try {
    await dbConnect();
    console.log('Connected to database successfully');
  } catch (error) {
    throw new SeedError(
      SeedErrorType.CONNECTION_FAILED,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Checks if there are existing articles in the database
 * @returns Promise that resolves with the count of existing articles
 * @throws SeedError if query fails
 */
async function checkExistingArticles(): Promise<number> {
  try {
    const existingCount = await BlogPost.countDocuments();
    console.log(`Found ${existingCount} existing articles`);
    return existingCount;
  } catch (error) {
    throw new SeedError(
      SeedErrorType.QUERY_FAILED,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Deletes all existing articles from the database
 * @returns Promise that resolves when articles are deleted
 * @throws SeedError if deletion fails
 */
async function deleteExistingArticles(): Promise<void> {
  try {
    await BlogPost.deleteMany({});
    console.log('Deleted existing articles');
  } catch (error) {
    throw new SeedError(
      SeedErrorType.DELETION_FAILED,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Categorizes seed data by category
 * @returns Object with articles grouped by category
 */
function categorizeSeedData() {
  const categorized: Record<string, typeof magazinSeedData> = {};
  
  magazinSeedData.forEach(article => {
    if (!categorized[article.category]) {
      categorized[article.category] = [];
    }
    categorized[article.category].push(article);
  });
  
  return categorized;
}

/**
 * Inserts seed data into the database
 * @returns Promise that resolves with the inserted articles
 * @throws SeedError if insertion fails
 */
async function insertSeedData() {
  try {
    console.log('Starting to seed articles by category...');
    
    const categorizedData = categorizeSeedData();
    const allResults = [];
    
    // Insert articles by category
    for (const [category, articles] of Object.entries(categorizedData)) {
      console.log(`Inserting ${articles.length} articles in category: ${category}`);
      const categoryResults = await BlogPost.insertMany(articles);
      allResults.push(...categoryResults);
    }
    
    console.log(`Successfully seeded ${allResults.length} magazine articles`);
    return allResults;
  } catch (error) {
    throw new SeedError(
      SeedErrorType.INSERTION_FAILED,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Logs information about each seeded article
 * @param articles Array of inserted blog post documents
 */
function logSeededArticles(articles: any[]): void {
  // Group articles by category for reporting
  const byCategory: Record<string, any[]> = {};
  
  articles.forEach(article => {
    if (!byCategory[article.category]) {
      byCategory[article.category] = [];
    }
    byCategory[article.category].push(article);
  });
  
  // Log articles by category
  for (const [category, categoryArticles] of Object.entries(byCategory)) {
    console.log(`\n${category} (${categoryArticles.length} articles):`);
    categoryArticles.forEach(article => {
      console.log(`- ${article.title} (${article.slug})`);
    });
  }
  
  console.log('\nSeeding completed successfully');
}

/**
 * Helper function to ask for user confirmation
 * @param question Question to ask the user
 * @returns Promise that resolves with boolean indicating user's answer
 */
function askForConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main function that orchestrates the seeding process
 */
export async function seedMagazinArticles(): Promise<void> {
  try {
    console.log('=== Starting Magazine Seeding Process ===');
    
    // Connect to database
    await connectToDatabase();
    
    // Check if we already have articles
    const existingCount = await checkExistingArticles();
    
    if (existingCount > 0) {
      const shouldContinue = await askForConfirmation(
        `There are already ${existingCount} articles in the database. Do you want to delete them and seed new ones? (y/n) `
      );
      
      if (!shouldContinue) {
        console.log('Seeding canceled by user');
        return;
      }
      
      // Delete existing articles
      await deleteExistingArticles();
    }
    
    // Insert seed data
    const result = await insertSeedData();
    
    // Log the titles and slugs for verification
    logSeededArticles(result);
    
  } catch (error) {
    if (error instanceof SeedError) {
      console.error(`\nSeeding failed: ${error.message}`);
    } else {
      console.error('\nUnexpected error during seeding:', error);
    }
    process.exit(1);
  } finally {
    // Close the connection and exit
    console.log('\n=== Seeding Process Completed ===');
    process.exit(0);
  }
}

// Only run the seed function if this file is executed directly
if (require.main === module) {
  seedMagazinArticles();
} 