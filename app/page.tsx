"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookHeart,
  Bookmark,
  CalendarDays,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Coffee,
  Compass,
  Cookie,
  Filter,
  Heart,
  Home as HomeIcon,
  KeyRound,
  Layers3,
  LibraryBig,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  LogOut,
  Menu,
  Milk,
  NotebookPen,
  Plus,
  Search,
  Send,
  Settings,
  Shell,
  ShoppingBasket,
  Sparkles,
  Star,
  Tags,
  UserRound,
  Utensils,
  Wheat,
  X
} from "lucide-react";
import { ClaudeChef } from "@/components/ClaudeChef";
import { RecipeModal } from "@/components/RecipeModal";
import { categories, type Recipe, type RecipeCategory, type RecipeInput } from "@/data/recipes";

type AuthState = "checking" | "locked" | "unlocked";

const SESSION_KEY = "cristy-recipe-session";

const fallbackRecipes: Recipe[] = [
  {
    id: "sample-1",
    title: "Creamy Garlic Parmesan Pasta",
    category: "Dinner",
    cook_time: "35 min",
    serves: "Serves 4",
    description: "Silky, golden, and exactly the sort of bowl that makes an ordinary evening feel looked after.",
    ingredients: "Pasta\nParmesan\nCream\nGarlic\nSpinach\nLemon",
    instructions: "Boil pasta until tender. Simmer garlic with cream, parmesan, and lemon. Toss with pasta and spinach.",
    image_url: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85",
    created_at: "2026-04-30T12:00:00Z"
  },
  {
    id: "sample-2",
    title: "Lemon Blueberry Cheesecake",
    category: "Dessert",
    cook_time: "1 hr",
    serves: "Serves 8",
    description: "Bright lemon, velvety filling, and a berry swirl that tastes like a handwritten summer note.",
    ingredients: "Cream cheese\nBlueberries\nLemon\nGraham crackers\nSugar",
    instructions: "Press crust, blend filling, swirl berries, and bake gently until just set.",
    image_url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=85",
    created_at: "2026-04-29T12:00:00Z"
  },
  {
    id: "sample-3",
    title: "Sunday Herb Roast Chicken",
    category: "Southern",
    cook_time: "1 hr 20 min",
    serves: "Serves 6",
    description: "Crisp skin, tender potatoes, and a lemony pan sauce worth saving for bread.",
    ingredients: "Chicken\nPotatoes\nRosemary\nThyme\nLemon\nButter",
    instructions: "Season chicken, tuck herbs under the skin, roast with potatoes, and rest before serving.",
    image_url: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=900&q=85",
    created_at: "2026-04-28T12:00:00Z"
  },
  {
    id: "sample-4",
    title: "Mango Sunrise Smoothie",
    category: "Breakfast",
    cook_time: "10 min",
    serves: "Serves 2",
    description: "Creamy mango, orange, and yogurt for a bright little start to the day.",
    ingredients: "Mango\nOrange juice\nGreek yogurt\nHoney\nIce",
    instructions: "Blend everything until smooth and pour into chilled glasses.",
    image_url: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=85",
    created_at: "2026-04-27T12:00:00Z"
  },
  {
    id: "sample-5",
    title: "Pomegranate Chicken Pilaf",
    category: "Holiday",
    cook_time: "55 min",
    serves: "Serves 5",
    description: "Fragrant rice, jeweled pomegranate, and warm spices for a table that feels special.",
    ingredients: "Chicken\nRice\nPomegranate\nAlmonds\nCinnamon\nParsley",
    instructions: "Brown chicken, toast rice with spices, simmer together, and finish with herbs and pomegranate.",
    image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=85",
    created_at: "2026-04-26T12:00:00Z"
  }
];

const navGroups = [
  { label: "Home", items: [{ label: "Dashboard", icon: HomeIcon }] },
  {
    label: "My Recipes",
    items: [
      { label: "All Recipes", icon: BookHeart },
      { label: "Favorites", icon: Heart },
      { label: "Categories", icon: Tags },
      { label: "Collections", icon: Layers3 },
      { label: "Ingredients", icon: Wheat },
      { label: "Meal Planner", icon: CalendarDays },
      { label: "Notes", icon: NotebookPen },
      { label: "Shopping Lists", icon: ShoppingBasket }
    ]
  },
  {
    label: "Kitchen Tools",
    items: [
      { label: "Converter", icon: Compass },
      { label: "Substitutions", icon: Milk },
      { label: "Tips & Tricks", icon: Lightbulb }
    ]
  },
  {
    label: "Settings",
    items: [
      { label: "Profile", icon: UserRound },
      { label: "Settings", icon: Settings }
    ]
  }
];

const categoryCards = [
  { name: "Breakfast", icon: Coffee, image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=240&q=80" },
  { name: "Lunch", icon: Utensils, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=240&q=80" },
  { name: "Dinner", icon: ChefHat, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=240&q=80" },
  { name: "Desserts", icon: Cookie, image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=240&q=80" },
  { name: "Lemons", icon: Sparkles, image: "https://images.unsplash.com/photo-1587324438673-56c78a866b15?auto=format&fit=crop&w=240&q=80" },
  { name: "Soups", icon: Utensils, image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=240&q=80" }
];

const shoppingItems = ["Chicken breast", "Fresh lemons", "Parmesan cheese", "Blueberries", "Baby spinach", "Heavy cream"];
const noteLines = ["Don't forget to buy flowers!", "Try fresh sea salt on roasted carrots.", "Mom likes almond in the biscotti."];

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
}

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [sessionToken, setSessionToken] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | "All">("All");
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(SESSION_KEY);
    if (!savedToken) {
      setAuthState("locked");
      return;
    }

    setSessionToken(savedToken);
    setAuthState("unlocked");
  }, []);

  useEffect(() => {
    if (authState === "unlocked" && sessionToken) {
      void fetchRecipes(sessionToken);
    }
  }, [authState, sessionToken]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = (await response.json()) as { token?: string; error?: string };
    if (!response.ok || !data.token) {
      setAuthError(data.error ?? "That password did not open the recipe book.");
      return;
    }

    window.localStorage.setItem(SESSION_KEY, data.token);
    setSessionToken(data.token);
    setAuthState("unlocked");
    setPassword("");
  }

  function lockRecipeBook() {
    window.localStorage.removeItem(SESSION_KEY);
    setSessionToken("");
    setAuthState("locked");
    setRecipes([]);
  }

  async function fetchRecipes(token = sessionToken) {
    setIsLoading(true);
    setErrorMessage("");

    const response = await fetch("/api/recipes", {
      headers: { "x-cristy-session": token }
    });

    const data = (await response.json()) as { recipes?: Recipe[]; error?: string };
    if (!response.ok) {
      setErrorMessage(data.error ?? "The recipe box could not be opened.");
      setRecipes(fallbackRecipes);
    } else {
      setRecipes(data.recipes?.length ? data.recipes : fallbackRecipes);
    }

    setIsLoading(false);
  }

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesCategory = activeCategory === "All" || recipe.category === activeCategory;
      const haystack = `${recipe.title} ${recipe.category} ${recipe.description} ${recipe.ingredients}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [recipes, query, activeCategory]);

  const featuredRecipe = filteredRecipes[0] ?? fallbackRecipes[0];
  const recentRecipes = filteredRecipes.slice(0, 7);

  const stats = [
    { label: "Saved Recipes", count: recipes.length || 128, subtitle: "All treasured dishes", icon: BookHeart },
    { label: "Family Favorites", count: Math.max(18, Math.round((recipes.length || 128) * 0.28)), subtitle: "Recipes worth repeating", icon: Heart },
    { label: "Recipe Collections", count: 12, subtitle: "Gathered by mood", icon: LibraryBig },
    { label: "Kitchen Notes", count: 73, subtitle: "Little cooking memories", icon: NotebookPen },
    { label: "Shopping Items", count: shoppingItems.length, subtitle: "Ready for the market", icon: ListChecks }
  ];

  function openAdd() {
    setSelectedRecipe(null);
    setModalMode("add");
  }

  function openEdit(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setModalMode("edit");
  }

  function openView(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setModalMode("view");
  }

  async function saveRecipe(recipe: Recipe | RecipeInput) {
    setErrorMessage("");

    const response = await fetch("/api/recipes", {
      method: "id" in recipe && recipe.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cristy-session": sessionToken
      },
      body: JSON.stringify(recipe)
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setErrorMessage(data.error ?? "This recipe could not be saved.");
      return;
    }

    setModalMode(null);
    await fetchRecipes();
  }

  async function deleteRecipe(id: string) {
    setErrorMessage("");
    const response = await fetch(`/api/recipes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-cristy-session": sessionToken }
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setErrorMessage(data.error ?? "This recipe could not be deleted.");
      return;
    }

    await fetchRecipes();
  }

  return (
    <>
      <AnimatePresence>
        {authState !== "unlocked" && (
          <motion.div
            className="lockScreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="lockScene" aria-hidden="true">
              <div className="lockLighthouse" />
              <div className="lockGrass grassOne" />
              <div className="lockGrass grassTwo" />
            </div>
            <motion.form
              className="lockCard"
              onSubmit={unlock}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 130, damping: 18 }}
            >
              <span className="lockIcon">
                <LockKeyhole size={26} />
              </span>
              <p className="scriptGreeting">Cristy&apos;s Private Recipe Book</p>
              <h1>Welcome back, Cristy</h1>
              <p className="lockCopy">A quiet place for favorite recipes, kitchen notes, shopping lists, and Claude Chef.</p>
              <label>
                Password
                <div className="passwordWrap">
                  <KeyRound size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoFocus
                    required
                    placeholder="Enter APP_PASSWORD"
                  />
                </div>
              </label>
              {authError && <p className="authError">{authError}</p>}
              <button type="submit">Unlock Recipe Book</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {authState === "unlocked" && (
        <main className="dashboardShell">
          <button className="mobileMenu" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>

          <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
            <button className="closeMenu" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </button>
            <div className="logoBlock">
              <div className="logoLighthouse" aria-hidden="true" />
              <div>
                <span className="logoScript">Cristy&apos;s</span>
                <strong>Recipes</strong>
                <small>Personal Recipe Organizer</small>
              </div>
            </div>

            <nav className="navGroups" aria-label="Recipe organizer navigation">
              {navGroups.map((group) => (
                <section key={group.label}>
                  <p>{group.label}</p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.label} className={item.label === "Dashboard" ? "active" : ""}>
                        <Icon size={16} />
                        {item.label}
                      </button>
                    );
                  })}
                </section>
              ))}
            </nav>

            <div className="profileCard">
              <div className="avatar">C</div>
              <div>
                <strong>Cristy</strong>
                <span>This is my happy place ♡</span>
              </div>
            </div>
          </aside>

          <section className="mainCanvas">
            <header className="heroHeader">
              <div className="coastalScene" aria-hidden="true">
                <div className="sceneSun" />
                <div className="sceneLighthouse" />
                <div className="seaGrass grassA" />
                <div className="seaGrass grassB" />
                <Shell className="shell shellOne" size={22} />
                <Shell className="shell shellTwo" size={18} />
              </div>
              <div className="topUtility">
                <div className="dateCard">
                  <CalendarDays size={15} />
                  <span>{todayLabel()}</span>
                </div>
                <button className="addRecipeButton" onClick={openAdd}>
                  <Plus size={15} />
                  Add New Recipe
                </button>
                <button className="iconButton" aria-label="Recipe reminders">
                  <Bell size={17} />
                  <span />
                </button>
                <button className="profileButton" aria-label="Cristy profile menu">
                  <span className="smallAvatar">C</span>
                  Cristy
                  <ChevronDown size={14} />
                </button>
                <button className="iconButton" onClick={lockRecipeBook} aria-label="Lock recipe book">
                  <LogOut size={17} />
                </button>
              </div>

              <motion.div
                className="heroCopy"
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45 }}
              >
                <p className="morningText">Good morning, Cristy! ☼</p>
                <h1>My Recipe Collection</h1>
                <p>All my favorite recipes, memories, and creations in one place. ♡</p>
              </motion.div>

              <div className="searchDock">
                <label className="searchBar">
                  <Search size={18} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search recipes, ingredients, categories..."
                  />
                  <button type="button">
                    <Filter size={15} />
                    Filter
                  </button>
                </label>
              </div>

              <section className="statRibbon" aria-label="Personal recipe collection">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.article
                      key={stat.label}
                      className="statCard"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <span>
                        <Icon size={19} />
                      </span>
                      <div>
                        <strong>{stat.count}</strong>
                        <p>{stat.label}</p>
                        <small>{stat.subtitle}</small>
                      </div>
                    </motion.article>
                  );
                })}
              </section>
            </header>

            {errorMessage && <div className="softError">{errorMessage}</div>}

            <div className="categoryFilter" aria-label="Filter recipes by category">
              <button className={activeCategory === "All" ? "active" : ""} onClick={() => setActiveCategory("All")}>
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={activeCategory === category ? "active" : ""}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <section className="contentGrid">
              <article className="panel recentPanel">
                <div className="panelHeader">
                  <h2>Recently Added Recipes</h2>
                  <button onClick={() => setActiveCategory("All")}>View All</button>
                </div>
                <div className="recipeMiniList">
                  {isLoading && <p className="loadingText">Opening the recipe box...</p>}
                  {!isLoading &&
                    recentRecipes.map((recipe) => (
                      <button key={recipe.id} className="miniRecipe" onClick={() => openView(recipe)}>
                        <img src={recipe.image_url} alt="" />
                        <span>
                          <strong>{recipe.title}</strong>
                          <small>{recipe.category}</small>
                        </span>
                        <Heart size={17} fill="#db7d73" />
                      </button>
                    ))}
                </div>
              </article>

              <article className="panel featuredPanel">
                <div className="panelHeader">
                  <h2>My Favorite Recipes</h2>
                  <button onClick={() => openView(featuredRecipe)}>View</button>
                </div>
                <img className="featuredImage" src={featuredRecipe.image_url} alt="" />
                <div className="featuredBody">
                  <span className="recipeTag">{featuredRecipe.category}</span>
                  <h2>{featuredRecipe.title}</h2>
                  <p>{featuredRecipe.description}</p>
                  <div className="stars" aria-label="Five star favorite">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <div className="featuredActions">
                    <button onClick={() => openView(featuredRecipe)}>Open Recipe</button>
                    <button onClick={() => openEdit(featuredRecipe)}>Edit</button>
                  </div>
                  <div className="carouselControls">
                    <button aria-label="Previous favorite">
                      <ChevronLeft size={17} />
                    </button>
                    <span className="active" />
                    <span />
                    <span />
                    <button aria-label="Next favorite">
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </article>

              <ClaudeChef sessionToken={sessionToken} />
            </section>

            <section className="lowerRow">
              <article className="panel categoryPanel">
                <div className="panelHeader">
                  <h2>Categories</h2>
                  <button>View</button>
                </div>
                <div className="categoryBubbles">
                  {categoryCards.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button key={category.name}>
                        <img src={category.image} alt="" />
                        <span>
                          <Icon size={14} />
                        </span>
                        <strong>{category.name}</strong>
                      </button>
                    );
                  })}
                </div>
              </article>

              <article className="panel notesPanel">
                <div className="panelHeader">
                  <h2>Quick Notes</h2>
                  <button>
                    <NotebookPen size={14} />
                  </button>
                </div>
                <div className="stickyNote">
                  {noteLines.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                  <Heart size={20} fill="#d77c6e" />
                </div>
              </article>

              <article className="panel shoppingPanel">
                <div className="panelHeader">
                  <h2>Shopping List</h2>
                  <button>
                    <ClipboardList size={14} />
                  </button>
                </div>
                <div className="checkList">
                  {shoppingItems.map((item, index) => (
                    <label key={item}>
                      <input type="checkbox" defaultChecked={index < 2} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </article>
            </section>
          </section>

          {modalMode && (
            <RecipeModal
              mode={modalMode}
              recipe={selectedRecipe}
              onClose={() => setModalMode(null)}
              onSave={saveRecipe}
              onDelete={deleteRecipe}
            />
          )}
        </main>
      )}
    </>
  );
}
