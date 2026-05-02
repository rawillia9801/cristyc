"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookHeart,
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
import {
  categories,
  type Recipe,
  type RecipeCategory,
  type RecipeCategoryMeta,
  type RecipeCollection,
  type RecipeInput,
  type RecipeNote,
  type ShoppingItem
} from "@/data/recipes";

type AuthState = "checking" | "locked" | "unlocked";

const SESSION_KEY = "cristy-recipe-session";

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

const categoryIconMap = {
  Breakfast: Coffee,
  Lunch: Utensils,
  Dinner: ChefHat,
  Dessert: Cookie,
  Holiday: Sparkles,
  Southern: Heart,
  Soup: Utensils,
  Lemon: Sparkles
} satisfies Record<RecipeCategory, typeof Coffee>;

const categoryImageFallbacks: Record<RecipeCategory, string> = {
  Breakfast: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=240&q=80",
  Lunch: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=240&q=80",
  Dinner: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=240&q=80",
  Dessert: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=240&q=80",
  Holiday: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=240&q=80",
  Southern: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=240&q=80",
  Soup: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=240&q=80",
  Lemon: "https://images.unsplash.com/photo-1587324438673-56c78a866b15?auto=format&fit=crop&w=240&q=80"
};

type DashboardResponse = {
  recipes?: Recipe[];
  notes?: RecipeNote[];
  shoppingItems?: ShoppingItem[];
  collections?: RecipeCollection[];
  categories?: RecipeCategoryMeta[];
  error?: string;
};

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
  const [notes, setNotes] = useState<RecipeNote[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [collections, setCollections] = useState<RecipeCollection[]>([]);
  const [categoryMetas, setCategoryMetas] = useState<RecipeCategoryMeta[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | "All">("All");
  const [activeView, setActiveView] = useState("Dashboard");
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);

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
    setNotes([]);
    setShoppingItems([]);
    setCollections([]);
    setCategoryMetas([]);
  }

  function expireSession(message = "Please unlock Cristy's recipe book again.") {
    window.localStorage.removeItem(SESSION_KEY);
    setSessionToken("");
    setRecipes([]);
    setNotes([]);
    setShoppingItems([]);
    setCollections([]);
    setCategoryMetas([]);
    setIsLoading(false);
    setAuthError(message);
    setAuthState("locked");
  }

  async function fetchRecipes(token = sessionToken) {
    setIsLoading(true);
    setErrorMessage("");

    const response = await fetch("/api/dashboard", {
      headers: { "x-cristy-session": token }
    });

    const data = (await response.json()) as DashboardResponse;
    if (!response.ok) {
      if (response.status === 401) {
        expireSession("Your saved session expired. Enter the password again.");
        return;
      }

      setErrorMessage(data.error ?? "The recipe box could not be opened.");
      setRecipes([]);
      setNotes([]);
      setShoppingItems([]);
      setCollections([]);
      setCategoryMetas([]);
    } else {
      setRecipes(data.recipes ?? []);
      setNotes(data.notes ?? []);
      setShoppingItems(data.shoppingItems ?? []);
      setCollections(data.collections ?? []);
      setCategoryMetas(data.categories ?? []);
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

  useEffect(() => {
    setFeaturedIndex(0);
  }, [activeCategory, query]);

  const favoriteRecipes = filteredRecipes.filter((recipe) => recipe.is_favorite);
  const featuredRecipes = favoriteRecipes.length ? favoriteRecipes : filteredRecipes;
  const featuredRecipe = featuredRecipes[featuredIndex] ?? null;
  const recentRecipes = filteredRecipes.slice(0, 7);

  const stats = [
    { label: "Saved Recipes", count: recipes.length, subtitle: "All treasured dishes", icon: BookHeart },
    { label: "Family Favorites", count: recipes.filter((recipe) => recipe.is_favorite).length, subtitle: "Recipes worth repeating", icon: Heart },
    { label: "Recipe Collections", count: collections.length, subtitle: "Gathered by mood", icon: LibraryBig },
    { label: "Kitchen Notes", count: notes.length, subtitle: "Little cooking memories", icon: NotebookPen },
    { label: "Shopping Items", count: shoppingItems.length, subtitle: "Ready for the market", icon: ListChecks }
  ];

  const displayCategories = categoryMetas.length
    ? categoryMetas
    : categories.map((category, index) => ({
        id: category,
        name: category,
        image_url: categoryImageFallbacks[category],
        icon: null,
        sort_order: index
      }));

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
      if (response.status === 401) {
        expireSession();
        return;
      }

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
      if (response.status === 401) {
        expireSession();
        return;
      }

      setErrorMessage(data.error ?? "This recipe could not be deleted.");
      return;
    }

    await fetchRecipes();
  }

  function handleNavClick(label: string) {
    setActiveView(label);
    setMenuOpen(false);

    if (label === "Dashboard" || label === "All Recipes") {
      setActiveCategory("All");
    }

    if (label === "Favorites") {
      setActiveView("Family Favorites");
    }

    if (label === "Categories") {
      setShowFilters(true);
    }

    if (label === "Shopping Lists") {
      document.querySelector(".shoppingPanel")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (label === "Notes") {
      document.querySelector(".notesPanel")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function openStat(label: string) {
    setActiveView(label);
    if (label === "Saved Recipes") {
      setActiveCategory("All");
    }
    if (label === "Family Favorites") {
      setActiveCategory("All");
    }
    if (label === "Kitchen Notes") {
      document.querySelector(".notesPanel")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (label === "Shopping Items") {
      document.querySelector(".shoppingPanel")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function moveFeatured(direction: -1 | 1) {
    if (!featuredRecipes.length) {
      return;
    }

    setFeaturedIndex((current) => (current + direction + featuredRecipes.length) % featuredRecipes.length);
  }

  async function addNote() {
    const body = window.prompt("Add a quick kitchen note");
    if (!body?.trim()) {
      return;
    }

    const response = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cristy-session": sessionToken
      },
      body: JSON.stringify({ body })
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      if (response.status === 401) {
        expireSession();
        return;
      }

      setErrorMessage(data.error ?? "This note could not be saved.");
      return;
    }

    await fetchRecipes();
  }

  async function deleteNote(id: string) {
    const response = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-cristy-session": sessionToken }
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      if (response.status === 401) {
        expireSession();
        return;
      }

      setErrorMessage(data.error ?? "This note could not be deleted.");
      return;
    }

    await fetchRecipes();
  }

  async function addShoppingItem() {
    const label = window.prompt("Add a shopping item");
    if (!label?.trim()) {
      return;
    }

    const response = await fetch("/api/shopping-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cristy-session": sessionToken
      },
      body: JSON.stringify({ label })
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      if (response.status === 401) {
        expireSession();
        return;
      }

      setErrorMessage(data.error ?? "This shopping item could not be saved.");
      return;
    }

    await fetchRecipes();
  }

  async function toggleShoppingItem(item: ShoppingItem, checked: boolean) {
    setShoppingItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, checked } : entry)));

    const response = await fetch("/api/shopping-items", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-cristy-session": sessionToken
      },
      body: JSON.stringify({ id: item.id, checked })
    });

    if (!response.ok) {
      if (response.status === 401) {
        expireSession();
        return;
      }

      await fetchRecipes();
    }
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
                      <button
                        key={item.label}
                        className={activeView === item.label || (item.label === "Dashboard" && activeView === "Dashboard") ? "active" : ""}
                        onClick={() => handleNavClick(item.label)}
                      >
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
                <button className="iconButton" aria-label="Recipe reminders" onClick={() => setActiveView("Kitchen Notes")}>
                  <Bell size={17} />
                  <span />
                </button>
                <button className="profileButton" aria-label="Cristy profile menu" onClick={() => setActiveView("Profile")}>
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
                  <button type="button" onClick={() => setShowFilters((current) => !current)}>
                    <Filter size={15} />
                    Filter
                  </button>
                </label>
              </div>

              <section className="statRibbon" aria-label="Personal recipe collection">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.button
                      key={stat.label}
                      className="statCard"
                      onClick={() => openStat(stat.label)}
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
                    </motion.button>
                  );
                })}
              </section>
            </header>

            {errorMessage && <div className="softError">{errorMessage}</div>}
            {activeView !== "Dashboard" && <div className="activeViewBanner">Showing: {activeView}</div>}

            {showFilters && <div className="categoryFilter" aria-label="Filter recipes by category">
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
            </div>}

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
                  {!isLoading && recentRecipes.length === 0 && (
                    <div className="emptyPanel">
                      <BookHeart size={24} />
                      <p>No recipes found yet.</p>
                      <button onClick={openAdd}>Add New Recipe</button>
                    </div>
                  )}
                </div>
              </article>

              <article className="panel featuredPanel">
                <div className="panelHeader">
                  <h2>My Favorite Recipes</h2>
                  <button onClick={() => (featuredRecipe ? openView(featuredRecipe) : openAdd())}>{featuredRecipe ? "View" : "Add"}</button>
                </div>
                {featuredRecipe ? (
                  <>
                    <img className="featuredImage" src={featuredRecipe.image_url} alt="" />
                    <div className="featuredBody">
                      <span className="recipeTag">{featuredRecipe.category}</span>
                      <h2>{featuredRecipe.title}</h2>
                      <p>{featuredRecipe.description}</p>
                      <div className="stars" aria-label={`${featuredRecipe.rating ?? 5} star favorite`}>
                        {[0, 1, 2, 3, 4].map((star) => (
                          <Star key={star} size={16} fill={star < (featuredRecipe.rating ?? 5) ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <div className="featuredActions">
                        <button onClick={() => openView(featuredRecipe)}>Open Recipe</button>
                        <button onClick={() => openEdit(featuredRecipe)}>Edit</button>
                      </div>
                      <div className="carouselControls">
                        <button aria-label="Previous favorite" onClick={() => moveFeatured(-1)}>
                          <ChevronLeft size={17} />
                        </button>
                        {featuredRecipes.slice(0, 5).map((recipe, index) => (
                          <button
                            key={recipe.id}
                            className={index === featuredIndex ? "dot active" : "dot"}
                            aria-label={`Show ${recipe.title}`}
                            onClick={() => setFeaturedIndex(index)}
                          />
                        ))}
                        <button aria-label="Next favorite" onClick={() => moveFeatured(1)}>
                          <ChevronRight size={17} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="emptyPanel featuredEmpty">
                    <Heart size={28} />
                    <p>Add a favorite recipe to feature it here.</p>
                    <button onClick={openAdd}>Add New Recipe</button>
                  </div>
                )}
              </article>

              <ClaudeChef sessionToken={sessionToken} />
            </section>

            <section className="lowerRow">
              <article className="panel categoryPanel">
                <div className="panelHeader">
                  <h2>Categories</h2>
                  <button onClick={() => setShowFilters((current) => !current)}>View</button>
                </div>
                <div className="categoryBubbles">
                  {displayCategories.map((category) => {
                    const Icon = categoryIconMap[category.name] ?? Tags;
                    return (
                      <button key={category.id} onClick={() => setActiveCategory(category.name)}>
                        <img src={category.image_url ?? categoryImageFallbacks[category.name]} alt="" />
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
                  <button onClick={addNote} aria-label="Add note">
                    <NotebookPen size={14} />
                  </button>
                </div>
                <div className="stickyNote">
                  {notes.slice(0, 4).map((note) => (
                    <button key={note.id} onClick={() => void deleteNote(note.id)} title="Click to remove note">
                      {note.body}
                    </button>
                  ))}
                  {notes.length === 0 && <p>Add a kitchen note with the pencil button.</p>}
                  <Heart size={20} fill="#d77c6e" />
                </div>
              </article>

              <article className="panel shoppingPanel">
                <div className="panelHeader">
                  <h2>Shopping List</h2>
                  <button onClick={addShoppingItem} aria-label="Add shopping item">
                    <ClipboardList size={14} />
                  </button>
                </div>
                <div className="checkList">
                  {shoppingItems.map((item) => (
                    <label key={item.id}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(event) => void toggleShoppingItem(item, event.target.checked)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                  {shoppingItems.length === 0 && <p className="loadingText">Add shopping items with the list button.</p>}
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
