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
  Edit3,
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
  Save,
  Search,
  Settings,
  Shell,
  ShoppingBasket,
  Sparkles,
  Star,
  Tags,
  Trash2,
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
type ViewName =
  | "Dashboard"
  | "All Recipes"
  | "Favorites"
  | "Categories"
  | "Collections"
  | "Ingredients"
  | "Meal Planner"
  | "Notes"
  | "Shopping Lists"
  | "Converter"
  | "Substitutions"
  | "Tips & Tricks"
  | "Profile"
  | "Settings";

type DashboardResponse = {
  recipes?: Recipe[];
  notes?: RecipeNote[];
  shoppingItems?: ShoppingItem[];
  collections?: RecipeCollection[];
  categories?: RecipeCategoryMeta[];
  error?: string;
};

const SESSION_KEY = "cristy-recipe-session";

const navGroups: Array<{ label: string; items: Array<{ label: ViewName; icon: typeof HomeIcon }> }> = [
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

const substitutions = [
  ["Heavy cream", "Half-and-half plus butter, evaporated milk, or coconut cream"],
  ["Buttermilk", "Milk plus lemon juice, rested for 5 minutes"],
  ["Egg", "Applesauce, flax egg, or yogurt depending on the recipe"],
  ["Fresh herbs", "Use one-third the amount of dried herbs"]
];

const tips = [
  "Salt pasta water until it tastes pleasantly seasoned.",
  "Let meat rest before slicing so the juices stay put.",
  "Chill cookie dough for thicker, richer cookies.",
  "Add lemon zest at the end for brighter flavor.",
  "Toast spices briefly to wake them up before simmering."
];

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
  const [activeView, setActiveView] = useState<ViewName>("Dashboard");
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState("");
  const [editingNoteText, setEditingNoteText] = useState("");
  const [newShoppingItem, setNewShoppingItem] = useState("");
  const [editingShoppingId, setEditingShoppingId] = useState("");
  const [editingShoppingText, setEditingShoppingText] = useState("");
  const [converterAmount, setConverterAmount] = useState("1");

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
      void fetchDashboard(sessionToken);
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
    setIsLoading(false);
    setAuthError(message);
    setAuthState("locked");
  }

  async function fetchDashboard(token = sessionToken) {
    setIsLoading(true);
    setErrorMessage("");
    const response = await fetch("/api/dashboard", { headers: { "x-cristy-session": token } });
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
      const matchesFavorites = activeView === "Favorites" ? recipe.is_favorite : true;
      const haystack = `${recipe.title} ${recipe.category} ${recipe.description} ${recipe.ingredients}`.toLowerCase();
      return matchesCategory && matchesFavorites && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [recipes, query, activeCategory, activeView]);

  useEffect(() => {
    setFeaturedIndex(0);
  }, [activeCategory, query, activeView]);

  const favoriteRecipes = recipes.filter((recipe) => recipe.is_favorite);
  const featuredRecipes = favoriteRecipes.length ? favoriteRecipes : filteredRecipes;
  const featuredRecipe = featuredRecipes[featuredIndex] ?? null;
  const recentRecipes = filteredRecipes.slice(0, 7);
  const allIngredients = useMemo(() => {
    const words = recipes.flatMap((recipe) =>
      recipe.ingredients
        .split(/\n|,/)
        .map((ingredient) => ingredient.trim())
        .filter(Boolean)
    );
    return Array.from(new Set(words)).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const displayCategories = categoryMetas.length
    ? categoryMetas
    : categories.map((category, index) => ({
        id: category,
        name: category,
        image_url: categoryImageFallbacks[category],
        icon: null,
        sort_order: index
      }));

  const stats = [
    { label: "Saved Recipes", view: "All Recipes" as ViewName, count: recipes.length, subtitle: "All treasured dishes", icon: BookHeart },
    { label: "Family Favorites", view: "Favorites" as ViewName, count: favoriteRecipes.length, subtitle: "Recipes worth repeating", icon: Heart },
    { label: "Recipe Collections", view: "Collections" as ViewName, count: collections.length, subtitle: "Gathered by mood", icon: LibraryBig },
    { label: "Kitchen Notes", view: "Notes" as ViewName, count: notes.length, subtitle: "Little cooking memories", icon: NotebookPen },
    { label: "Shopping Items", view: "Shopping Lists" as ViewName, count: shoppingItems.length, subtitle: "Ready for the market", icon: ListChecks }
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
      headers: { "Content-Type": "application/json", "x-cristy-session": sessionToken },
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
    await fetchDashboard();
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
    await fetchDashboard();
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = newNote.trim();
    if (!body) return;
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cristy-session": sessionToken },
      body: JSON.stringify({ body })
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      if (response.status === 401) return expireSession();
      setErrorMessage(data.error ?? "This note could not be saved.");
      return;
    }
    setNewNote("");
    await fetchDashboard();
  }

  async function saveNote(id: string) {
    const body = editingNoteText.trim();
    if (!body) return;
    const response = await fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-cristy-session": sessionToken },
      body: JSON.stringify({ id, body })
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      if (response.status === 401) return expireSession();
      setErrorMessage(data.error ?? "This note could not be updated.");
      return;
    }
    setEditingNoteId("");
    setEditingNoteText("");
    await fetchDashboard();
  }

  async function deleteNote(id: string) {
    const response = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-cristy-session": sessionToken }
    });
    if (!response.ok) {
      if (response.status === 401) return expireSession();
      setErrorMessage("This note could not be deleted.");
      return;
    }
    await fetchDashboard();
  }

  async function addShoppingItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = newShoppingItem.trim();
    if (!label) return;
    const response = await fetch("/api/shopping-items", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cristy-session": sessionToken },
      body: JSON.stringify({ label })
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      if (response.status === 401) return expireSession();
      setErrorMessage(data.error ?? "This shopping item could not be saved.");
      return;
    }
    setNewShoppingItem("");
    await fetchDashboard();
  }

  async function updateShoppingItem(item: ShoppingItem, patch: Partial<Pick<ShoppingItem, "label" | "checked" | "category">>) {
    setShoppingItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, ...patch } : entry)));
    const response = await fetch("/api/shopping-items", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-cristy-session": sessionToken },
      body: JSON.stringify({ id: item.id, ...patch })
    });
    if (!response.ok) {
      if (response.status === 401) return expireSession();
      setErrorMessage("This shopping item could not be updated.");
      await fetchDashboard();
      return;
    }
    setEditingShoppingId("");
    setEditingShoppingText("");
    await fetchDashboard();
  }

  async function deleteShoppingItem(id: string) {
    const response = await fetch(`/api/shopping-items?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-cristy-session": sessionToken }
    });
    if (!response.ok) {
      if (response.status === 401) return expireSession();
      setErrorMessage("This shopping item could not be deleted.");
      return;
    }
    await fetchDashboard();
  }

  function selectView(view: ViewName) {
    setActiveView(view);
    setMenuOpen(false);
    if (view === "All Recipes" || view === "Dashboard") setActiveCategory("All");
    if (view === "Favorites") setActiveCategory("All");
  }

  function moveFeatured(direction: -1 | 1) {
    if (!featuredRecipes.length) return;
    setFeaturedIndex((current) => (current + direction + featuredRecipes.length) % featuredRecipes.length);
  }

  function renderRecipeGrid(list: Recipe[], emptyText = "No recipes found yet.") {
    return (
      <div className="libraryGrid">
        {list.map((recipe) => (
          <article className="libraryCard" key={recipe.id}>
            <button onClick={() => openView(recipe)} className="libraryImage">
              <img src={recipe.image_url} alt="" />
              {recipe.is_favorite && <Heart size={18} fill="currentColor" />}
            </button>
            <div>
              <span>{recipe.category}</span>
              <h3>{recipe.title}</h3>
              <p>{recipe.description}</p>
              <div className="cardTinyActions">
                <button onClick={() => openView(recipe)}>Open</button>
                <button onClick={() => openEdit(recipe)}>Edit</button>
              </div>
            </div>
          </article>
        ))}
        {!isLoading && list.length === 0 && <EmptyState text={emptyText} action={openAdd} />}
      </div>
    );
  }

  function renderNotesManager(compact = false) {
    return (
      <section className={compact ? "notesStack compact" : "notesStack"}>
        <form className="inlineComposer" onSubmit={addNote}>
          <input value={newNote} onChange={(event) => setNewNote(event.target.value)} placeholder="Add a kitchen note..." />
          <button><Plus size={16} /> Add</button>
        </form>
        <div className="noteGrid">
          {notes.slice(0, compact ? 4 : undefined).map((note) => (
            <article className="noteCard" key={note.id}>
              {editingNoteId === note.id ? (
                <>
                  <textarea value={editingNoteText} onChange={(event) => setEditingNoteText(event.target.value)} />
                  <div className="rowActions">
                    <button onClick={() => void saveNote(note.id)}><Save size={15} /> Save</button>
                    <button onClick={() => setEditingNoteId("")}><X size={15} /> Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <p>{note.body}</p>
                  <div className="rowActions">
                    <button onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.body); }}><Edit3 size={15} /> Edit</button>
                    <button onClick={() => void deleteNote(note.id)}><Trash2 size={15} /> Delete</button>
                  </div>
                </>
              )}
            </article>
          ))}
          {notes.length === 0 && <p className="quietEmpty">No notes yet. Add the first one above.</p>}
        </div>
      </section>
    );
  }

  function renderShoppingManager(compact = false) {
    return (
      <section className={compact ? "shoppingStack compact" : "shoppingStack"}>
        <form className="inlineComposer" onSubmit={addShoppingItem}>
          <input value={newShoppingItem} onChange={(event) => setNewShoppingItem(event.target.value)} placeholder="Add a shopping item..." />
          <button><Plus size={16} /> Add</button>
        </form>
        <div className="shoppingListFull">
          {shoppingItems.slice(0, compact ? 6 : undefined).map((item) => (
            <article className="shoppingRow" key={item.id}>
              <input type="checkbox" checked={item.checked} onChange={(event) => void updateShoppingItem(item, { checked: event.target.checked })} />
              {editingShoppingId === item.id ? (
                <input className="shoppingEditInput" value={editingShoppingText} onChange={(event) => setEditingShoppingText(event.target.value)} />
              ) : (
                <span className={item.checked ? "checked" : ""}>{item.label}</span>
              )}
              <div className="rowActions">
                {editingShoppingId === item.id ? (
                  <>
                    <button onClick={() => void updateShoppingItem(item, { label: editingShoppingText })}><Save size={15} /> Save</button>
                    <button onClick={() => setEditingShoppingId("")}><X size={15} /> Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingShoppingId(item.id); setEditingShoppingText(item.label); }}><Edit3 size={15} /> Edit</button>
                    <button onClick={() => void deleteShoppingItem(item.id)}><Trash2 size={15} /> Delete</button>
                  </>
                )}
              </div>
            </article>
          ))}
          {shoppingItems.length === 0 && <p className="quietEmpty">No shopping items yet. Add one above.</p>}
        </div>
      </section>
    );
  }

  function renderMainView() {
    if (activeView === "All Recipes") return <ViewShell title="All Recipes" subtitle="Every saved recipe in Cristy's private collection.">{renderRecipeGrid(filteredRecipes)}</ViewShell>;
    if (activeView === "Favorites") return <ViewShell title="Favorites" subtitle="The dishes Cristy reaches for again and again.">{renderRecipeGrid(favoriteRecipes, "No favorite recipes yet.")}</ViewShell>;
    if (activeView === "Categories") {
      return (
        <ViewShell title="Categories" subtitle="Browse the recipe box by mood, meal, and memory.">
          <div className="categoryViewGrid">
            {displayCategories.map((category) => {
              const Icon = categoryIconMap[category.name] ?? Tags;
              const count = recipes.filter((recipe) => recipe.category === category.name).length;
              return (
                <button key={category.id} onClick={() => { setActiveCategory(category.name); setActiveView("All Recipes"); }}>
                  <img src={category.image_url ?? categoryImageFallbacks[category.name]} alt="" />
                  <span><Icon size={17} /></span>
                  <strong>{category.name}</strong>
                  <small>{count} recipes</small>
                </button>
              );
            })}
          </div>
        </ViewShell>
      );
    }
    if (activeView === "Collections") {
      return (
        <ViewShell title="Collections" subtitle="Saved bundles for dinners, holidays, and cozy weekends.">
          <div className="collectionGrid">
            {collections.map((collection) => (
              <article key={collection.id}>
                <Layers3 size={24} />
                <h3>{collection.name}</h3>
                <p>{collection.description}</p>
                <small>{recipes.filter((recipe) => recipe.collection_id === collection.id).length} recipes</small>
              </article>
            ))}
            {collections.length === 0 && <p className="quietEmpty">No collections yet. Add collections in Supabase to group recipes.</p>}
          </div>
        </ViewShell>
      );
    }
    if (activeView === "Ingredients") return <ViewShell title="Ingredients" subtitle="A pantry-style lookup built from saved recipe ingredients."><div className="ingredientCloud">{allIngredients.map((item) => <button key={item} onClick={() => setQuery(item)}>{item}</button>)}{allIngredients.length === 0 && <p className="quietEmpty">Add recipes with ingredients to fill this pantry.</p>}</div></ViewShell>;
    if (activeView === "Meal Planner") return <ViewShell title="Meal Planner" subtitle="A simple weekly planning board."><div className="plannerGrid">{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => <article key={day}><strong>{day}</strong><p>{recipes[index % Math.max(recipes.length, 1)]?.title ?? "Choose a recipe"}</p></article>)}</div></ViewShell>;
    if (activeView === "Notes") return <ViewShell title="Notes" subtitle="Full kitchen note management with add, edit, save, cancel, and delete.">{renderNotesManager()}</ViewShell>;
    if (activeView === "Shopping Lists") return <ViewShell title="Shopping Lists" subtitle="A private grocery checklist that saves to Supabase.">{renderShoppingManager()}</ViewShell>;
    if (activeView === "Converter") return <ViewShell title="Converter" subtitle="Quick kitchen measurement helpers."><div className="toolPanel"><input value={converterAmount} onChange={(event) => setConverterAmount(event.target.value)} /><p>{Number(converterAmount || 0)} cups = {Number(converterAmount || 0) * 16} tablespoons = {Number(converterAmount || 0) * 48} teaspoons</p></div></ViewShell>;
    if (activeView === "Substitutions") return <ViewShell title="Substitutions" subtitle="Ingredient swaps for the middle of cooking."><div className="subGrid">{substitutions.map(([from, to]) => <article key={from}><strong>{from}</strong><p>{to}</p></article>)}</div></ViewShell>;
    if (activeView === "Tips & Tricks") return <ViewShell title="Tips & Tricks" subtitle="A growing archive of useful kitchen wisdom."><div className="tipsList">{tips.map((tip) => <article key={tip}><Lightbulb size={17} /><p>{tip}</p></article>)}</div></ViewShell>;
    if (activeView === "Profile") return <ViewShell title="Profile" subtitle="Cristy's private recipe space."><div className="profileView"><div className="avatar largeAvatar">C</div><h3>Cristy</h3><p>This is my happy place ♡</p></div></ViewShell>;
    if (activeView === "Settings") return <ViewShell title="Settings" subtitle="Privacy and recipe book controls."><div className="settingsView"><button onClick={lockRecipeBook}><LogOut size={16} /> Lock Recipe Book</button><p>Password is controlled by APP_PASSWORD.</p></div></ViewShell>;
    return renderDashboard();
  }

  function renderDashboard() {
    return (
      <>
        <section className="contentGrid">
          <article className="panel recentPanel">
            <div className="panelHeader"><h2>Recently Added Recipes</h2><button onClick={() => selectView("All Recipes")}>View All</button></div>
            <div className="recipeMiniList">
              {isLoading && <p className="loadingText">Opening the recipe box...</p>}
              {recentRecipes.map((recipe) => (
                <button key={recipe.id} className="miniRecipe" onClick={() => openView(recipe)}>
                  <img src={recipe.image_url} alt="" />
                  <span><strong>{recipe.title}</strong><small>{recipe.category}</small></span>
                  <Heart size={17} fill={recipe.is_favorite ? "#db7d73" : "none"} />
                </button>
              ))}
              {!isLoading && recentRecipes.length === 0 && <EmptyState text="No recipes found yet." action={openAdd} />}
            </div>
          </article>

          <article className="panel featuredPanel">
            <div className="panelHeader"><h2>My Favorite Recipes</h2><button onClick={() => (featuredRecipe ? openView(featuredRecipe) : openAdd())}>{featuredRecipe ? "View" : "Add"}</button></div>
            {featuredRecipe ? (
              <>
                <img className="featuredImage" src={featuredRecipe.image_url} alt="" />
                <div className="featuredBody">
                  <span className="recipeTag">{featuredRecipe.category}</span>
                  <h2>{featuredRecipe.title}</h2>
                  <p>{featuredRecipe.description}</p>
                  <div className="stars">{[0, 1, 2, 3, 4].map((star) => <Star key={star} size={16} fill={star < (featuredRecipe.rating ?? 5) ? "currentColor" : "none"} />)}</div>
                  <div className="featuredActions"><button onClick={() => openView(featuredRecipe)}>Open Recipe</button><button onClick={() => openEdit(featuredRecipe)}>Edit</button></div>
                  <div className="carouselControls">
                    <button aria-label="Previous favorite" onClick={() => moveFeatured(-1)}><ChevronLeft size={17} /></button>
                    {featuredRecipes.slice(0, 5).map((recipe, index) => <button key={recipe.id} className={index === featuredIndex ? "dot active" : "dot"} aria-label={`Show ${recipe.title}`} onClick={() => setFeaturedIndex(index)} />)}
                    <button aria-label="Next favorite" onClick={() => moveFeatured(1)}><ChevronRight size={17} /></button>
                  </div>
                </div>
              </>
            ) : <EmptyState text="Add a favorite recipe to feature it here." action={openAdd} />}
          </article>

          <ClaudeChef sessionToken={sessionToken} />
        </section>

        <section className="lowerRow">
          <article className="panel categoryPanel">
            <div className="panelHeader"><h2>Categories</h2><button onClick={() => selectView("Categories")}>View</button></div>
            <div className="categoryBubbles">{displayCategories.slice(0, 6).map((category) => { const Icon = categoryIconMap[category.name] ?? Tags; return <button key={category.id} onClick={() => { setActiveCategory(category.name); selectView("All Recipes"); }}><img src={category.image_url ?? categoryImageFallbacks[category.name]} alt="" /><span><Icon size={14} /></span><strong>{category.name}</strong></button>; })}</div>
          </article>
          <article className="panel notesPanel"><div className="panelHeader"><h2>Quick Notes</h2><button onClick={() => selectView("Notes")}><NotebookPen size={14} /></button></div>{renderNotesManager(true)}</article>
          <article className="panel shoppingPanel"><div className="panelHeader"><h2>Shopping List</h2><button onClick={() => selectView("Shopping Lists")}><ClipboardList size={14} /></button></div>{renderShoppingManager(true)}</article>
        </section>
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {authState !== "unlocked" && (
          <motion.div className="lockScreen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.form className="lockCard" onSubmit={unlock} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <span className="lockIcon"><LockKeyhole size={26} /></span>
              <p className="scriptGreeting">Cristy's Private Recipe Book</p>
              <h1>Welcome back, Cristy</h1>
              <p className="lockCopy">A quiet place for favorite recipes, kitchen notes, shopping lists, and Claude Chef.</p>
              <label>Password<div className="passwordWrap"><KeyRound size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required placeholder="Enter APP_PASSWORD" /></div></label>
              {authError && <p className="authError">{authError}</p>}
              <button type="submit">Unlock Recipe Book</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {authState === "unlocked" && (
        <main className="dashboardShell">
          <button className="mobileMenu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
            <button className="closeMenu" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={18} /></button>
            <div className="logoBlock">
              <div className="logoPhoto" aria-hidden="true" />
              <div><span className="logoScript">Cristy's</span><strong>Recipes</strong><small>Personal Recipe Organizer</small></div>
            </div>
            <nav className="navGroups" aria-label="Recipe organizer navigation">
              {navGroups.map((group) => <section key={group.label}><p>{group.label}</p>{group.items.map((item) => { const Icon = item.icon; return <button key={item.label} className={activeView === item.label ? "active" : ""} onClick={() => selectView(item.label)}><Icon size={16} />{item.label}</button>; })}</section>)}
            </nav>
            <button className="profileCard" onClick={() => selectView("Profile")}><div className="avatar">C</div><div><strong>Cristy</strong><span>This is my happy place ♡</span></div></button>
          </aside>

          <section className="mainCanvas">
            <header className="heroHeader">
              <div className="topUtility">
                <div className="dateCard"><CalendarDays size={15} /><span>{todayLabel()}</span></div>
                <button className="addRecipeButton" onClick={openAdd}><Plus size={15} />Add New Recipe</button>
                <button className="iconButton" aria-label="Recipe reminders" onClick={() => selectView("Notes")}><Bell size={17} /><span /></button>
                <button className="profileButton" aria-label="Cristy profile menu" onClick={() => selectView("Profile")}><span className="smallAvatar">C</span>Cristy<ChevronDown size={14} /></button>
                <button className="iconButton" onClick={lockRecipeBook} aria-label="Lock recipe book"><LogOut size={17} /></button>
              </div>
              <motion.div className="heroCopy" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }}>
                <p className="morningText">Good morning, Cristy! ☼</p>
                <h1>My Recipe Collection</h1>
                <p>All my favorite recipes, memories, and creations in one place. ♡</p>
              </motion.div>
              <div className="searchDock"><label className="searchBar"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes, ingredients, categories..." /><button type="button" onClick={() => setShowFilters((current) => !current)}><Filter size={15} />Filter</button></label></div>
              <section className="statRibbon" aria-label="Personal recipe collection">{stats.map((stat, index) => { const Icon = stat.icon; return <motion.button key={stat.label} className="statCard" onClick={() => selectView(stat.view)} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.05 }}><span><Icon size={19} /></span><div><strong>{stat.count}</strong><p>{stat.label}</p><small>{stat.subtitle}</small></div></motion.button>; })}</section>
            </header>

            {errorMessage && <div className="softError">{errorMessage}</div>}
            {showFilters && <div className="categoryFilter" aria-label="Filter recipes by category"><button className={activeCategory === "All" ? "active" : ""} onClick={() => setActiveCategory("All")}>All</button>{categories.map((category) => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>}
            {renderMainView()}
          </section>

          {modalMode && <RecipeModal mode={modalMode} recipe={selectedRecipe} onClose={() => setModalMode(null)} onSave={saveRecipe} onDelete={deleteRecipe} />}
        </main>
      )}
    </>
  );
}

function EmptyState({ text, action }: { text: string; action: () => void }) {
  return <div className="emptyPanel"><BookHeart size={24} /><p>{text}</p><button onClick={action}>Add New Recipe</button></div>;
}

function ViewShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="viewPanel"><div className="viewHeader"><h2>{title}</h2><p>{subtitle}</p></div>{children}</section>;
}
