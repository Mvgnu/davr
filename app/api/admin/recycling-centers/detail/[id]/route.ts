import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/index';
import { pool } from '@/lib/db';
import { PoolClient } from 'pg'; // Import PoolClient type if needed for transaction

// Define types for clarity (optional but recommended)
interface MaterialOfferDb {
  material_id: number;
  price: number | null;
  min_quantity: number | null;
  max_quantity: number | null;
  notes: string | null;
  active: boolean | null; // Assuming active status might be stored
  // Add other relevant fields from recycling_center_offers
  material_name: string; // Added for convenience
  material_category: string; // Added for convenience
}

interface AvailableMaterial {
  id: number;
  name: string;
  category: string;
}

interface AvailableOwner {
  id: string;
  email: string;
  name: string;
}

// Get a single recycling center by ID (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) { // Simplified check
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Admin Check (using session data)
    if (session.user.role !== 'ADMIN' && !session.user.isAdmin) {
       return NextResponse.json(
         { success: false, error: 'Forbidden - Admin access required' },
         { status: 403 }
       );
    }
    
    const id = params.id;
    const client = await pool.connect(); // Use a client for multiple queries

    try {
      // 1. Get basic recycling center details
      const centerResult = await client.query(
        'SELECT rc.*, u.email as owner_email, u.name as owner_name FROM recycling_centers rc LEFT JOIN users u ON rc.owner_id = u.id WHERE rc.id = $1',
        [id]
      );

      if (centerResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Recycling center not found' },
          { status: 404 }
        );
      }
      const recyclingCenter = centerResult.rows[0];

      // 2. Get Material Offers (where price is not null)
      const offersResult = await client.query<MaterialOfferDb>(`
        SELECT 
          rco.material_id, 
          rco.price, 
          rco.min_quantity, 
          rco.max_quantity, 
          rco.notes,
          rco.active,
          m.name as material_name,
          m.category as material_category
        FROM recycling_center_offers rco
        JOIN materials m ON rco.material_id = m.id
        WHERE rco.recycling_center_id = $1 AND rco.price IS NOT NULL
      `, [id]);
      
      // 3. Get Accepted Material IDs (where price IS null or assuming a separate table/flag)
      // Assuming offers table stores both, and price IS NULL means 'accepted only'
      const acceptedResult = await client.query<{ material_id: number }>(`
        SELECT material_id 
        FROM recycling_center_offers 
        WHERE recycling_center_id = $1 AND price IS NULL 
      `, [id]);
      const acceptedMaterialIds = acceptedResult.rows.map(row => row.material_id);

      // 4. Get all available materials for selection
      const materialsResult = await client.query<AvailableMaterial>(`
        SELECT id, name, category 
        FROM materials 
        ORDER BY category, name
      `);
      
      // 5. Get all potential owners (business users)
      const ownersResult = await client.query<AvailableOwner>(`
        SELECT id, email, name
        FROM users
        WHERE role = 'business' OR role = 'ADMIN' OR role = 'admin' -- Include admin as potential owner? Or adjust role name
        ORDER BY email
      `);
      
      return NextResponse.json({
        success: true,
        data: {
          recyclingCenter: {
              ...recyclingCenter,
              // Add the fetched related data directly if needed by frontend immediately
              // This structure might differ based on frontend needs
              material_offers: offersResult.rows, // Full offer details
              accepted_material_ids: acceptedMaterialIds // Just the IDs
          },
          availableMaterials: materialsResult.rows,
          availableOwners: ownersResult.rows
        }
      });

    } finally {
      client.release(); // Release the client back to the pool
    }

  } catch (error) {
    console.error('Error fetching recycling center [Admin]:', error);
    // More specific error logging can be added here
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recycling center data', details: errorMessage },
      { status: 500 }
    );
  }
}

// Define type for incoming material offers in PATCH request
interface MaterialOfferInput {
  material_id: number;
  price: number;
  min_quantity?: number | null;
  max_quantity?: number | null;
  notes?: string | null;
  active?: boolean | null;
}

// Update a recycling center by ID (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, { status: 401 }
      );
    }
    if (session.user.role !== 'ADMIN' && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' }, { status: 403 }
      );
    }

    const id = params.id;
    const updateData = await request.json();
    
    // Separate material data from other center data
    const { acceptedMaterialIds, materialOffers, ...centerData } = updateData;

    if (Object.keys(centerData).length === 0 && !acceptedMaterialIds && !materialOffers) {
      return NextResponse.json(
        { success: false, error: 'No update data provided' }, { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Update basic recycling center info if provided
      if (Object.keys(centerData).length > 0) {
        const allowedFields = [
          'name', 'address', 'city', 'postal_code', 'state', 'country',
          'latitude', 'longitude', 'phone', 'email', 'website', 'description',
          'hours_of_operation', 'verification_status', 'owner_id', 'slug'
        ];
        
        const updates: string[] = [];
        const values: any[] = [];
        let paramCounter = 1;
        
        allowedFields.forEach(field => {
          if (centerData[field] !== undefined) {
            updates.push(`${field} = $${paramCounter}`);
            values.push(centerData[field]);
            paramCounter++;
          }
        });
        
        if (updates.length > 0) {
            updates.push(`updated_at = NOW()`);
            const updateQuery = `UPDATE recycling_centers SET ${updates.join(', ')} WHERE id = $${paramCounter}`;
            values.push(id);
            await client.query(updateQuery, values);
        } else {
            // If only material data was sent, still update the timestamp
            await client.query('UPDATE recycling_centers SET updated_at = NOW() WHERE id = $1', [id]);
        }
      }
      
      // 2. Update materials (accepted and offers)
      if (acceptedMaterialIds !== undefined || materialOffers !== undefined) {
          // First, delete all existing entries for this center in recycling_center_offers
          await client.query(
              'DELETE FROM recycling_center_offers WHERE recycling_center_id = $1',
              [id]
          );

          // Insert accepted materials (price will be NULL)
          if (Array.isArray(acceptedMaterialIds) && acceptedMaterialIds.length > 0) {
              const acceptedValues = acceptedMaterialIds.map(matId => `(${id}, ${matId}, NULL)`).join(', ');
              await client.query(
                  `INSERT INTO recycling_center_offers (recycling_center_id, material_id, price) VALUES ${acceptedValues}`
              );
              // Note: This assumes price IS NULL indicates accepted. Adjust if schema is different.
          }

          // Insert material offers (with price and other details)
          if (Array.isArray(materialOffers) && materialOffers.length > 0) {
              let offerParamCounter = 1;
              const offerValues: any[] = [];
              const offerPlaceholders = materialOffers.map((offer: MaterialOfferInput) => {
                  const placeholder = (
                      `($${offerParamCounter++}, $${offerParamCounter++}, $${offerParamCounter++}, ` +
                      `$${offerParamCounter++}, $${offerParamCounter++}, $${offerParamCounter++}, $${offerParamCounter++})`
                  );
                  offerValues.push(
                      id,
                      offer.material_id,
                      offer.price,
                      offer.min_quantity,
                      offer.max_quantity,
                      offer.notes,
                      offer.active ?? true // Default active to true if not provided
                  );
                  return placeholder;
              }).join(', ');
              
              if (offerValues.length > 0) {
                await client.query(
                    `INSERT INTO recycling_center_offers (
                        recycling_center_id, material_id, price, min_quantity, 
                        max_quantity, notes, active
                     ) VALUES ${offerPlaceholders}`,
                    offerValues
                );
              }
          }
      }
      
      await client.query('COMMIT');
      
      // Fetch the final updated center data to return (similar to GET)
      const finalResult = await pool.query(`
        SELECT 
          rc.*,
          u.email as owner_email, u.name as owner_name,
          (
            SELECT json_agg(json_build_object(
              'material_id', rco.material_id, 
              'price', rco.price, 
              'min_quantity', rco.min_quantity, 
              'max_quantity', rco.max_quantity, 
              'notes', rco.notes,
              'active', rco.active,
              'material_name', m.name,
              'material_category', m.category
            ))
            FROM recycling_center_offers rco
            JOIN materials m ON rco.material_id = m.id
            WHERE rco.recycling_center_id = rc.id AND rco.price IS NOT NULL
          ) as material_offers,
          (
             SELECT json_agg(rco.material_id)
             FROM recycling_center_offers rco
             WHERE rco.recycling_center_id = rc.id AND rco.price IS NULL
          ) as accepted_material_ids
        FROM recycling_centers rc
        LEFT JOIN users u ON rc.owner_id = u.id
        WHERE rc.id = $1
      `, [id]);

      if (finalResult.rows.length === 0) { 
        // Should not happen if update succeeded, but good practice
        return NextResponse.json({ success: false, error: 'Failed to retrieve updated center'}, { status: 404 });
      } 
      
      return NextResponse.json({
        success: true,
        data: finalResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating recycling center [Admin] (Transaction rolled back):', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Check for specific DB errors like constraint violations if needed
      return NextResponse.json(
        { success: false, error: 'Failed to update recycling center', details: errorMessage },
        { status: 500 }
      );
    } finally {
      client.release();
    }

  } catch (error) {
      // Error before connecting to DB (e.g., JSON parsing error)
      console.error('Error processing PATCH request [Admin]:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { success: false, error: 'Failed to process update request', details: errorMessage },
        { status: 400 } // Likely a client-side error (bad JSON)
      );
  }
}

// Delete a recycling center by ID (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const id = params.id;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if recycling center exists
      const checkResult = await client.query(
        'SELECT id FROM recycling_centers WHERE id = $1',
        [id]
      );
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Recycling center not found' },
          { status: 404 }
        );
      }
      
      // Delete associated records first
      // 1. Delete materials associations
      await client.query(
        'DELETE FROM recycling_center_offers WHERE recycling_center_id = $1',
        [id]
      );
      
      // 2. Delete any reports associated with this center
      await client.query(
        'DELETE FROM recycling_center_reports WHERE recycling_center_id = $1',
        [id]
      );
      
      // 3. Delete any reviews associated with this center
      await client.query(
        'DELETE FROM recycling_center_reviews WHERE recycling_center_id = $1',
        [id]
      );
      
      // Finally, delete the recycling center
      await client.query(
        'DELETE FROM recycling_centers WHERE id = $1',
        [id]
      );
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: 'Recycling center deleted successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting recycling center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete recycling center' },
      { status: 500 }
    );
  }
}

// This file has the GET, PATCH, and DELETE endpoints for the recycling centers with ID

// The functions are already exported individually, so we don't need to export them again
// export { GET, PATCH, DELETE }; 