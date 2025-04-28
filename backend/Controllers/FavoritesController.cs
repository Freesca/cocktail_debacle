using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Entities;
using backend.DTOs; // Importa il namespace per CocktailDto
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FavoritesController : ControllerBase
{
    private readonly AppDbContext _context;

    public FavoritesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: /api/favorites
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetUserFavorites()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        int userIdInt = Convert.ToInt32(userId); // Converte userId in int
        var favorites = await _context.Users
            .Where(u => u.Id == userIdInt)
            .Include(u => u.Favorites) // Carica i preferiti (UserFavorites)
            .ThenInclude(uf => uf.Cocktail) // Carica i cocktail associati
            .SelectMany(u => u.Favorites)
            .Select(uf => new CocktailDto
            {
                IdDrink = uf.Cocktail != null ? uf.Cocktail.IdDrink : "", // Controllo esplicito dei nulli
                StrDrink = uf.Cocktail != null ? uf.Cocktail.StrDrink : "",
                StrDrinkThumb = uf.Cocktail != null ? uf.Cocktail.StrDrinkThumb : "",
                Popularity = uf.Cocktail != null ? uf.Cocktail.FavoritedBy.Count : 0, // Controllo esplicito dei nulli
                ReviewsCount = uf.Cocktail != null ? uf.Cocktail.Reviews.Count : 0 // Controllo esplicito dei nulli
            })
            .ToListAsync();


        return Ok(favorites);
    }


    // POST: /api/favorites/15346
    [HttpPost("{idDrink}")]
    [Authorize]
    public async Task<IActionResult> AddFavorite(string idDrink)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        var user = await _context.Users
            .Include(u => u.Favorites)
            .FirstOrDefaultAsync(u => u.Id.ToString() == userId);

        if (user == null)
            return NotFound(new { message = "Utente non trovato." });

        var cocktail = await _context.Cocktails.FindAsync(idDrink);
        if (cocktail == null)
            return NotFound();

        if (!user.Favorites.Any(uf => uf.CocktailId == idDrink))
        {
            var userFavorite = new UserFavorite
            {
                UserId = user.Id,
                CocktailId = idDrink
            };
            _context.UserFavorites.Add(userFavorite);
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Cocktail aggiunto ai preferiti." });
    }



    // DELETE: /api/favorites/15346
    [HttpDelete("{idDrink}")]
    [Authorize]
    public async Task<IActionResult> RemoveFavorite(string idDrink)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        var user = await _context.Users
            .Include(u => u.Favorites)
            .FirstOrDefaultAsync(u => u.Id.ToString() == userId);

        var cocktail = await _context.Cocktails.FindAsync(idDrink);
        if (cocktail == null)
            return NotFound();

        if (user == null)
            return NotFound(new { message = "Utente non trovato." });
        var userFavorite = user.Favorites.FirstOrDefault(uf => uf.CocktailId == idDrink);

        if (userFavorite != null)
        {
            _context.UserFavorites.Remove(userFavorite);
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Cocktail rimosso dai preferiti." });
    }
}
