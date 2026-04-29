"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Leaf, Plus, Search, Soup, Sparkles, Utensils, Wheat } from "lucide-react";
import { ClaudeChef } from "@/components/ClaudeChef";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeModal } from "@/components/RecipeModal";
import { categories, type Recipe, type RecipeCategory, type RecipeInput } from "@/data/recipes";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | "All">("All");
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void fetchRecipes();
  }, []);

  async function fetchRecipes() {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("recipes")
      .select("id,title,category,ingredients,instructions,image_url,cook_time,serves,description,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setRecipes([]);
    } else {
      setRecipes((data ?? []) as Recipe[]);
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

    if ("id" in recipe && recipe.id) {
      const { error } = await supabase
        .from("recipes")
        .update({
          title: recipe.title,
          category: recipe.category,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          image_url: recipe.image_url,
          cook_time: recipe.cook_time,
          serves: recipe.serves,
          description: recipe.description
        })
        .eq("id", recipe.id);

      if (error) {
        setErrorMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("recipes").insert({
        title: recipe.title,
        category: recipe.category,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        image_url: recipe.image_url,
        cook_time: recipe.cook_time,
        serves: recipe.serves,
        description: recipe.description
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }
    }

    setModalMode(null);
    await fetchRecipes();
  }

  async function deleteRecipe(id: string) {
    setErrorMessage("");
    const { error } = await supabase.from("recipes").delete().eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await fetchRecipes();
  }

  return (
    <main className="pageShell">
      <div className="paperFrame">
        <div className="sideDecoration leftSide" aria-hidden="true" />
        <section className="hero">
          <div className="heroCopy">
            <div className="topFlourish">
              <Sparkles size={24} />
            </div>
            <div className="titleWrap">
              <Leaf className="titleLeaf leftLeaf" size={48} />
              <h1>Cristy&apos;s Recipes</h1>
              <Leaf className="titleLeaf rightLeaf" size={48} />
            </div>
            <p className="tagline">From my kitchen to yours ♡</p>
            <p className="intro">
              Passed down favorites, handwritten memories,
              <br />
              and every dish worth making again.
            </p>

            <label className="searchWrap">
              <Search size={24} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search recipes, ingredients, categories..."
              />
            </label>

            <div className="filterRow">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`filterBtn ${category.toLowerCase()} ${activeCategory === category ? "active" : ""}`}
                  onClick={() => setActiveCategory(activeCategory === category ? "All" : category)}
                >
                  {category === "Breakfast" && <Wheat size={15} />}
                  {category === "Dinner" && <Utensils size={15} />}
                  {category === "Dessert" && <Soup size={15} />}
                  {category === "Holiday" && <Sparkles size={15} />}
                  {category === "Southern" && <Heart size={15} fill="currentColor" />}
                  {category}
                </button>
              ))}
              <button className="addHeroBtn" onClick={openAdd}>
                <Plus size={15} />
                Add New Recipe
              </button>
            </div>
          </div>

          <div className="heroArt" aria-label="Rustic recipe book and baking scene">
            <img
              className="heroPhoto"
              src="https://images.pexels.com/photos/29666875/pexels-photo-29666875.jpeg?auto=compress&cs=tinysrgb&w=1100"
              alt=""
            />
            <div className="heroPhotoWash" />
            <div className="secretNote">
              the secret
              <br />
              ingredient is
              <strong> always love</strong> ♡
            </div>
          </div>
        </section>

        <div className="sectionDivider">
          <span />
          <Sparkles size={21} />
          <span />
        </div>

        <div className="favoritesHeader">
          <h2>Family Favorites</h2>
          <button onClick={() => setActiveCategory("All")}>View All Recipes →</button>
        </div>

        <section className="mainGrid">
          <div className="cardsGrid">
            {isLoading && <p className="emptyState">Gathering recipes from the family box...</p>}
            {errorMessage && !isLoading && <p className="emptyState">{errorMessage}</p>}
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onView={openView} onEdit={openEdit} onDelete={deleteRecipe} />
            ))}
            {!isLoading && !errorMessage && filteredRecipes.length === 0 && <p className="emptyState">No recipes found in the recipe box.</p>}
          </div>
          <ClaudeChef />
        </section>

        <section className="ctaBar">
          <div className="whiskMark">
            <span>♡</span>
          </div>
          <p>Have a recipe to share? Add it to your collection!</p>
          <button onClick={openAdd}>
            <Plus size={17} />
            Add New Recipe
          </button>
        </section>
      </div>
      <div className="ginghamStrip" aria-hidden="true" />

      {modalMode && (
        <RecipeModal
          mode={modalMode}
          recipe={selectedRecipe}
          onClose={() => setModalMode(null)}
          onSave={saveRecipe}
        />
      )}
    </main>
  );
}
