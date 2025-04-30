using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.EntityFrameworkCore;


namespace backend.Services;

public class RecommendationService
{
    private readonly AppDbContext _context;

    public RecommendationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CocktailDto>> GetRecommendedCocktailsForUserAsync(int userId)
    {
        var favorites = await _context.UserFavorites
            .Include(uf => uf.Cocktail)
            .Where(uf => uf.UserId == userId)
            .ToListAsync();
        
        // Step 1: Prendi gli ingredienti dei cocktail preferiti
        var favoriteIngredients = favorites
            .SelectMany(uf => new[]
            {
                uf.Cocktail.StrIngredient1, uf.Cocktail.StrIngredient2, uf.Cocktail.StrIngredient3,
                uf.Cocktail.StrIngredient4, uf.Cocktail.StrIngredient5, uf.Cocktail.StrIngredient6,
                uf.Cocktail.StrIngredient7, uf.Cocktail.StrIngredient8, uf.Cocktail.StrIngredient9,
                uf.Cocktail.StrIngredient10, uf.Cocktail.StrIngredient11, uf.Cocktail.StrIngredient12,
                uf.Cocktail.StrIngredient13, uf.Cocktail.StrIngredient14, uf.Cocktail.StrIngredient15
            })
            .Where(i => !string.IsNullOrEmpty(i))
            .Distinct()
            .ToList();

        // Step 2: Confronta con tutti i cocktail e calcola il punteggio
        var ranked = await _context.Cocktails
            .AsNoTracking()
            .Select(c => new
            {
                Cocktail = c,
                MatchCount = new[]
                {
                    c.StrIngredient1, c.StrIngredient2, c.StrIngredient3,
                    c.StrIngredient4, c.StrIngredient5, c.StrIngredient6,
                    c.StrIngredient7, c.StrIngredient8, c.StrIngredient9,
                    c.StrIngredient10, c.StrIngredient11, c.StrIngredient12,
                    c.StrIngredient13, c.StrIngredient14, c.StrIngredient15
                }
                .Where(i => !string.IsNullOrEmpty(i) && favoriteIngredients.Contains(i!))
                .Count()
            })
            .Where(r => r.MatchCount > 0)
            .OrderByDescending(r => r.MatchCount)
            .ThenByDescending(r => r.Cocktail.FavoritedBy.Count)
            .Take(12)
            .ToListAsync();

        // Step 3: Mappa in DTO
        return ranked.Select(r => new CocktailDto
        {
            IdDrink = r.Cocktail.IdDrink,
            StrDrink = r.Cocktail.StrDrink,
            StrDrinkThumb = r.Cocktail.StrDrinkThumb,
            Popularity = r.Cocktail.FavoritedBy.Count,
            ReviewsCount = r.Cocktail.Reviews.Count,
        }).ToList();
    }
}
