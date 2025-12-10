-- ============================================
-- BLACKBIRD COMPLETE MENU - FROM PHOTOS
-- Run after schema.sql
-- ============================================

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (id, name, slug, description, display_order) VALUES
  ('cat-coffee', 'Coffee', 'coffee', 'Hot house favorites', 1),
  ('cat-espresso', 'Espresso', 'espresso', 'Classics & distinctive drinks', 2),
  ('cat-coldbrew', 'Cold Brew', 'cold-brew', '24-hour steeped', 3),
  ('cat-tea', 'Tea', 'tea', 'Hot, iced & house favorites', 4),
  ('cat-restoratives', 'Restoratives', 'restoratives', 'Sparkling, refreshing, caffeine-free', 5),
  ('cat-lotus', 'Lotus', 'lotus', 'Cascara infused, sparkling fruit drinks', 6),
  ('cat-breakfast', 'Breakfast', 'breakfast', 'Fresh baked & more', 7),
  ('cat-lunch', 'Lunch', 'lunch', 'Starts at 11am', 8),
  ('cat-comics', 'Comics', 'comics', 'New releases & back issues', 9);

UPDATE categories SET available_from = '11:00', available_until = '17:00' WHERE slug = 'lunch';

-- ============================================
-- COFFEE (HOT)
-- ============================================
INSERT INTO products (id, category_id, name, description, product_type, base_price, display_order, badge, notes) VALUES
  ('cof-001', 'cat-coffee', 'Fresh Brew', 'House roasted, smooth & bright', 'drink', 3.00, 1, NULL, NULL),
  ('cof-002', 'cat-coffee', 'Alpha Flight', 'Maple syrup, cream', 'drink', 3.75, 2, 'Popular', NULL),
  ('cof-003', 'cat-coffee', 'Bad Bambi', 'Salted caramel, toffee, vanilla, cream', 'drink', 3.75, 3, NULL, 'Cannot be made dairy free'),
  ('cof-004', 'cat-coffee', 'Dark Knight', 'Dark chocolate, cream, vanilla', 'drink', 3.75, 4, 'Best Seller', NULL),
  ('cof-005', 'cat-coffee', 'King''s Canter', 'Coconut, vanilla, cream', 'drink', 3.75, 5, NULL, NULL),
  ('cof-006', 'cat-coffee', 'White Queen', 'White chocolate, cream', 'drink', 3.75, 6, NULL, 'Cannot be made dairy free');

INSERT INTO product_sizes (product_id, name, price, display_order, is_default) VALUES
  ('cof-001', 'Regular', 3.00, 1, true), ('cof-001', 'Large', 3.65, 2, false),
  ('cof-002', 'Regular', 3.75, 1, true), ('cof-002', 'Large', 4.75, 2, false),
  ('cof-003', 'Regular', 3.75, 1, true), ('cof-003', 'Large', 4.75, 2, false),
  ('cof-004', 'Regular', 3.75, 1, true), ('cof-004', 'Large', 4.75, 2, false),
  ('cof-005', 'Regular', 3.75, 1, true), ('cof-005', 'Large', 4.75, 2, false),
  ('cof-006', 'Regular', 3.75, 1, true), ('cof-006', 'Large', 4.75, 2, false);

-- ============================================
-- ESPRESSO
-- ============================================
-- Classics
INSERT INTO products (id, category_id, name, description, product_type, base_price, display_order, badge, notes) VALUES
  ('esp-001', 'cat-espresso', 'Espresso', 'Classic shot', 'drink', 2.25, 1, NULL, 'Decaf and iced options available'),
  ('esp-002', 'cat-espresso', 'Americano', 'Espresso with hot water', 'drink', 3.50, 2, NULL, 'Decaf and iced options available'),
  ('esp-003', 'cat-espresso', 'Cappuccino', 'Espresso with steamed milk foam', 'drink', 4.50, 3, NULL, 'Decaf and iced options available'),
  ('esp-004', 'cat-espresso', 'Latte', 'Espresso with steamed milk', 'drink', 4.50, 4, 'Popular', 'Decaf and iced options available'),
  ('esp-005', 'cat-espresso', 'Flat White', 'Espresso with velvety steamed milk', 'drink', 4.50, 5, NULL, 'Decaf and iced options available'),
  ('esp-006', 'cat-espresso', 'Cafe con Leche', 'Cuban-style espresso with milk', 'drink', 4.50, 6, NULL, 'Decaf and iced options available'),
  ('esp-007', 'cat-espresso', 'Mocha', 'Espresso with chocolate and steamed milk', 'drink', 4.75, 7, NULL, 'Decaf and iced options available'),
  ('esp-008', 'cat-espresso', 'Cortado / Cortadito', 'Cuban espresso shot, raw sugar, dash of steamed milk', 'drink', 4.00, 8, NULL, 'Decaf and iced options available'),
  -- Distinctive
  ('esp-009', 'cat-espresso', 'Outer Dark', 'Blackberry and dark chocolate', 'drink', 5.00, 9, 'Distinctive', 'Decaf and iced options available'),
  ('esp-010', 'cat-espresso', 'Honey Bee', 'Cuban espresso shot, honey, vanilla, dash of steamed milk', 'drink', 4.00, 10, 'Distinctive', 'Decaf and iced options available'),
  ('esp-011', 'cat-espresso', 'Bohemian', 'Lavender and white chocolate with steamed oat milk', 'drink', 5.50, 11, 'Distinctive', 'Contains dairy'),
  ('esp-012', 'cat-espresso', 'Mr. Peanutbutter', 'Peanut butter, butterscotch, salted toffee', 'drink', 4.75, 12, 'Distinctive', 'Decaf and iced options available');

INSERT INTO product_sizes (product_id, name, price, display_order, is_default) VALUES
  ('esp-001', 'Regular', 2.25, 1, true),
  ('esp-002', 'Regular', 3.50, 1, true),
  ('esp-003', 'Regular', 4.50, 1, true),
  ('esp-004', 'Regular', 4.50, 1, true),
  ('esp-005', 'Regular', 4.50, 1, true),
  ('esp-006', 'Regular', 4.50, 1, true),
  ('esp-007', 'Regular', 4.75, 1, true),
  ('esp-008', 'Regular', 4.00, 1, true),
  ('esp-009', 'Regular', 5.00, 1, true),
  ('esp-010', 'Regular', 4.00, 1, true),
  ('esp-011', 'Regular', 5.50, 1, true),
  ('esp-012', 'Regular', 4.75, 1, true);

-- ============================================
-- COLD BREW (24 Hour Steep)
-- ============================================
INSERT INTO products (id, category_id, name, description, product_type, base_price, display_order, badge, notes) VALUES
  ('cb-001', 'cat-coldbrew', 'Cold Brew', '24-hour steeped, served over ice', 'drink', 4.00, 1, NULL, NULL),
  ('cb-002', 'cat-coldbrew', 'Alpha Flight', 'Maple syrup, cream', 'drink', 5.00, 2, NULL, NULL),
  ('cb-003', 'cat-coldbrew', 'Bad Bambi', 'Salted toffee, caramel, vanilla, cream', 'drink', 5.00, 3, NULL, 'Cannot be made dairy free'),
  ('cb-004', 'cat-coldbrew', 'Dark Knight', 'Dark chocolate, cream, vanilla', 'drink', 5.00, 4, 'Best Seller', NULL),
  ('cb-005', 'cat-coldbrew', 'King''s Canter', 'Coconut, vanilla, cream', 'drink', 5.00, 5, NULL, NULL),
  ('cb-006', 'cat-coldbrew', 'White Queen', 'White chocolate, cream', 'drink', 5.00, 6, NULL, 'Cannot be made dairy free'),
  ('cb-007', 'cat-coldbrew', 'Brown Sugar', 'Brown sugar, spices, espresso, oat milk', 'drink', 5.25, 7, 'New', NULL),
  ('cb-008', 'cat-coldbrew', 'Buckeye', 'Peanut butter, chocolate, vanilla, cream', 'drink', 5.25, 8, NULL, NULL),
  ('cb-009', 'cat-coldbrew', 'Naughty Chai', 'Chai spiced cold brew, cream', 'drink', 5.25, 9, NULL, NULL);

INSERT INTO product_sizes (product_id, name, price, display_order, is_default) VALUES
  ('cb-001', 'Small', 4.00, 1, true), ('cb-001', 'Medium', 4.75, 2, false), ('cb-001', 'Large', 5.50, 3, false),
  ('cb-002', 'Small', 5.00, 1, true), ('cb-002', 'Medium', 5.50, 2, false), ('cb-002', 'Large', 6.00, 3, false),
  ('cb-003', 'Small', 5.00, 1, true), ('cb-003', 'Medium', 5.50, 2, false), ('cb-003', 'Large', 6.00, 3, false),
  ('cb-004', 'Small', 5.00, 1, true), ('cb-004', 'Medium', 5.50, 2, false), ('cb-004', 'Large', 6.00, 3, false),
  ('cb-005', 'Small', 5.00, 1, true), ('cb-005', 'Medium', 5.50, 2, false), ('cb-005', 'Large', 6.00, 3, false),
  ('cb-006', 'Small', 5.00, 1, true), ('cb-006', 'Medium', 5.50, 2, false), ('cb-006', 'Large', 6.00, 3, false),
  ('cb-007', 'Small', 5.25, 1, true), ('cb-007', 'Medium', 5.75, 2, false), ('cb-007', 'Large', 6.25, 3, false),
  ('cb-008', 'Small', 5.25, 1, true), ('cb-008', 'Medium', 5.75, 2, false), ('cb-008', 'Large', 6.25, 3, false),
  ('cb-009', 'Small', 5.25, 1, true), ('cb-009', 'Medium', 5.75, 2, false), ('cb-009', 'Large', 6.25, 3, false);

-- ============================================
-- TEA
-- ============================================
INSERT INTO products (id, category_id, name, description, product_type, base_price, display_order, badge) VALUES
  ('tea-001', 'cat-tea', 'Hot Tea', 'Earl grey, chai, chamomile, fire tower, jasmine, mushroom, breakfast, tropical green, yerba mate, and seasonals', 'drink', 3.50, 1, NULL),
  ('tea-002', 'cat-tea', 'Iced Tea', 'Any tea served over ice', 'drink', 5.00, 2, NULL),
  ('tea-003', 'cat-tea', 'Matcha Latte', 'Ceremonial grade matcha, steamed milk', 'drink', 5.50, 3, 'Popular'),
  ('tea-004', 'cat-tea', '007', 'Earl grey, lavender, vanilla, cream', 'drink', 4.00, 4, 'House Favorite'),
  ('tea-005', 'cat-tea', 'Bad Wolf', 'Jasmine, rose, vanilla, cream', 'drink', 4.00, 5, 'House Favorite');

INSERT INTO product_sizes (product_id, name, price, display_order, is_default) VALUES
  ('tea-001', 'Regular', 3.50, 1, true), ('tea-001', 'Large', 4.00, 2, false),
  ('tea-002', 'Regular', 5.00, 1, true), ('tea-002', 'Large', 5.50, 2, false),
  ('tea-003', 'Regular', 5.50, 1, true),
  ('tea-004', 'Regular', 4.00, 1, true), ('tea-004', 'Large', 4.25, 2, false),
  ('tea-005', 'Regular', 4.00, 1, true), ('tea-005', 'Large', 4.25, 2, false);

-- ============================================
-- RESTORATIVES (Sparkling, Caffeine-Free)
-- ============================================
INSERT INTO products (id, category_id, name, description, product_type, base_price, display_order, badge) VALUES
  ('rest-001', 'cat-restoratives', 'Ch-Ch-Ch-Cherry Bomb', 'Cherry and lime', 'drink', 4.50, 1, NULL),
  ('rest-002', 'cat-restoratives', 'Maitlander', 'Citrus', 'drink', 4.50, 2, NULL),
  ('rest-003', 'cat-restoratives', 'Nirvana', 'Lavender and blackberry', 'drink', 4.50, 3, NULL),
  ('rest-004', 'cat-restoratives', 'Sublime', 'Cucumber and lime', 'drink', 4.50, 4, NULL);

INSERT INTO product_sizes (product_id, name, price, display_order, is_default) VALUES
  ('rest-001', 'Small', 4.50, 1, true), ('rest-001', 'Medium', 5.25, 2, false), ('rest-001', 'Large', 5.75, 3, false),
  ('rest-002', 'Small', 4.50, 1, true), ('rest-002', 'Medium', 5.25, 2, false), ('rest-002', 'Large', 5.75, 3, false),
  ('rest-003', 'Small', 4.50, 1, true), ('rest-003', 'Medium', 5.25, 2, false), ('rest-003', 'Large', 5.75, 3, false),
  ('rest-004', 'Small', 4.50, 1, true), ('rest-004', 'Medium', 5.25, 2, false), ('rest-004', 'Large', 5.75, 3, false);

-- ============================================
-- LOTUS (Cascara Infused, Sparkling Fruit Drinks)
-- ============================================
INSERT INTO products (id, category_id, name, description, product_type, base_price, display_order, badge) VALUES
  ('lotus-001', 'cat-lotus', 'Atom Eve', 'Peach, rose, butterfly pea flower', 'drink', 5.00, 1, NULL),
  ('lotus-002', 'cat-lotus', 'Bee''s Knees', 'Coconut, honey, pineapple, vanilla', 'drink', 5.00, 2, NULL),
  ('lotus-003', 'cat-lotus', 'Let the Good Times Roll', 'Green apple, butterfly pea flower', 'drink', 5.00, 3, NULL);

INSERT INTO product_sizes (product_id, name, price, display_order, is_default) VALUES
  ('lotus-001', 'Small', 5.00, 1, true), ('lotus-001', 'Medium', 5.75, 2, false), ('lotus-001', 'Large', 6.00, 3, false),
  ('lotus-002', 'Small', 5.00, 1, true), ('lotus-002', 'Medium', 5.75, 2, false), ('lotus-002', 'Large', 6.00, 3, false),
  ('lotus-003', 'Small', 5.00, 1, true), ('lotus-003', 'Medium', 5.75, 2, false), ('lotus-003', 'Large', 6.00, 3, false);

-- ============================================
-- BREAKFAST
-- ============================================
INSERT INTO products (id, category_id, name, description, product_type, base_price, display_order, badge, notes) VALUES
  ('food-001', 'cat-breakfast', 'Overnight Oats', 'Oats and chia seeds set overnight with oat milk and sweetened with maple syrup', 'food', 4.50, 1, 'Vegan', NULL),
  ('food-002', 'cat-breakfast', 'Bagel', 'Plain or Everything', 'food', 4.50, 2, NULL, NULL),
  ('food-003', 'cat-breakfast', 'Simple Mais Bon', 'Nutella and fresh strawberries on a croissant, served warm', 'food', 6.00, 3, NULL, NULL),
  ('food-004', 'cat-breakfast', 'Ham and Cheese Croissant', 'Savory croissant with ham & melted cheese', 'food', 6.00, 4, NULL, NULL),
  ('food-005', 'cat-breakfast', 'Eggy Weggy', 'Ham, egg, and cheese on your choice of croissant, plain bagel, or everything bagel', 'food', 7.00, 5, 'Hearty', NULL);

INSERT INTO product_sizes (product_id, name, price, display_order, is_default) VALUES
  ('food-001', 'Regular', 4.50, 1, true),
  ('food-002', 'Regular', 4.50, 1, true),
  ('food-003', 'Regular', 6.00, 1, true),
  ('food-004', 'Regular', 6.00, 1, true),
  ('food-005', 'Regular', 7.00, 1, true);

-- Overnight Oats toppings (choose up to 3)
INSERT INTO modifier_groups (id, product_id, name, description, max_selections) VALUES
  ('mg-oats', 'food-001', 'Toppings', 'Choose up to 3', 3);

INSERT INTO modifiers (group_id, name, price, display_order) VALUES
  ('mg-oats', 'Peanut Butter', 0, 1),
  ('mg-oats', 'Nutella', 0, 2),
  ('mg-oats', 'Strawberries', 0, 3),
  ('mg-oats', 'Blueberries', 0, 4),
  ('mg-oats', 'Chocolate Chips', 0, 5);

-- Bagel spreads (required)
INSERT INTO modifier_groups (id, product_id, name, description, min_selections, max_selections, is_required) VALUES
  ('mg-bagel', 'food-002', 'Spread', 'Choose a spread', 1, 1, true);

INSERT INTO modifiers (group_id, name, price, display_order) VALUES
  ('mg-bagel', 'Cream Cheese', 0, 1),
  ('mg-bagel', 'Butter', 0, 2),
  ('mg-bagel', 'Honey', 0, 3),
  ('mg-bagel', 'Peanut Butter', 0, 4);

-- Bagel type (required)
INSERT INTO modifier_groups (id, product_id, name, description, min_selections, max_selections, is_required) VALUES
  ('mg-bagel-type', 'food-002', 'Type', 'Choose bagel type', 1, 1, true);

INSERT INTO modifiers (group_id, name, price, display_order) VALUES
  ('mg-bagel-type', 'Plain', 0, 1),
  ('mg-bagel-type', 'Everything', 0, 2);

-- Eggy Weggy bread choice
INSERT INTO modifier_groups (id, product_id, name, description, min_selections, max_selections, is_required) VALUES
  ('mg-eggy', 'food-005', 'Bread', 'Choose your bread', 1, 1, true);

INSERT INTO modifiers (group_id, name, price, display_order) VALUES
  ('mg-eggy', 'Croissant', 0, 1),
  ('mg-eggy', 'Plain Bagel', 0, 2),
  ('mg-eggy', 'Everything Bagel', 0, 3);

-- ============================================
-- LUNCH (Starts at 11am)
-- ============================================
INSERT INTO products (id, category_id, name, description, product_type, base_price, display_order, badge, notes) VALUES
  ('lunch-001', 'cat-lunch', 'Avant Gardener', 'Cream cheese, sliced cucumber, tomatoes, sriracha, watercress, spring mix, and honey on toasted multigrain, served with kettle chips', 'food', 12.00, 1, NULL, NULL),
  ('lunch-002', 'cat-lunch', 'Black Phillip', 'Ham, havarti cheese, goat cheese & blackberry preserve on sourdough, served with kettle chips', 'food', 13.00, 2, NULL, NULL),
  ('lunch-003', 'cat-lunch', 'Caprese', 'Pesto, mozzarella and tomatoes on sourdough, served with kettle chips', 'food', 11.00, 3, NULL, 'Contains pine nuts');

INSERT INTO product_sizes (product_id, name, price, display_order, is_default) VALUES
  ('lunch-001', 'Regular', 12.00, 1, true),
  ('lunch-002', 'Regular', 13.00, 1, true),
  ('lunch-003', 'Regular', 11.00, 1, true);

-- Avant Gardener protein add-ons
INSERT INTO modifier_groups (id, product_id, name, description, max_selections) VALUES
  ('mg-avant', 'lunch-001', 'Add Protein', 'Optional', 2);

INSERT INTO modifiers (group_id, name, price, display_order) VALUES
  ('mg-avant', 'Add Turkey', 1.50, 1),
  ('mg-avant', 'Add Ham', 1.50, 2);

-- Caprese protein add-ons
INSERT INTO modifier_groups (id, product_id, name, description, max_selections) VALUES
  ('mg-caprese', 'lunch-003', 'Add Protein', 'Optional', 2);

INSERT INTO modifiers (group_id, name, price, display_order) VALUES
  ('mg-caprese', 'Add Turkey', 1.50, 1),
  ('mg-caprese', 'Add Ham', 1.50, 2);

-- ============================================
-- COMICS (from theblackbirdroost.com)
-- ============================================
INSERT INTO products (id, category_id, name, description, product_type, base_price, display_order, badge, publisher, image_url) VALUES
  ('comic-001', 'cat-comics', '4 Kids Walk Into A Bank TP', '', 'comic', 14.99, 1, NULL, 'Black Mask', NULL),
  ('comic-002', 'cat-comics', '9 Times My Work Has Been Ripped Off TP', 'Raymond Biesinger', 'comic', 78.95, 2, NULL, 'Art Book', NULL),
  ('comic-003', 'cat-comics', 'A Man and His Cat Vol. 12', '', 'comic', 14.99, 3, NULL, 'Square Enix Manga', NULL),
  ('comic-004', 'cat-comics', 'A Man and His Cat Vol. 13', '', 'comic', 14.99, 4, 'New', 'Square Enix Manga', NULL),
  ('comic-005', 'cat-comics', 'A Vampire in the Bathhouse', '', 'comic', 13.99, 5, NULL, 'Manga', NULL),
  ('comic-006', 'cat-comics', 'Absolute Superman Vol 1: Last Dust of Krypton', '', 'comic', 17.99, 6, 'New', 'DC Comics', NULL),
  ('comic-007', 'cat-comics', 'Absolute Wonder Woman Vol 1: The Last Amazon', '', 'comic', 17.99, 7, 'New', 'DC Comics', NULL),
  ('comic-008', 'cat-comics', 'Action Comics #252 Facsimile Edition', 'First appearance of Supergirl', 'comic', 3.99, 8, 'Classic', 'DC Comics', NULL);

INSERT INTO product_sizes (product_id, name, price, display_order, is_default) VALUES
  ('comic-001', 'Standard', 14.99, 1, true),
  ('comic-002', 'Standard', 78.95, 1, true),
  ('comic-003', 'Standard', 14.99, 1, true),
  ('comic-004', 'Standard', 14.99, 1, true),
  ('comic-005', 'Standard', 13.99, 1, true),
  ('comic-006', 'Standard', 17.99, 1, true),
  ('comic-007', 'Standard', 17.99, 1, true),
  ('comic-008', 'Standard', 3.99, 1, true);

-- ============================================
-- SUMMARY
-- ============================================
-- Coffee: 6 items (2 sizes each)
-- Espresso: 12 items (classics + distinctive)
-- Cold Brew: 9 items (3 sizes each)
-- Tea: 5 items
-- Restoratives: 4 items (3 sizes each)
-- Lotus: 3 items (3 sizes each)
-- Breakfast: 5 items (with modifiers)
-- Lunch: 3 items (with modifiers)
-- Comics: 8 items
-- TOTAL: 55 products
-- ============================================
