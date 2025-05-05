using backend.Data;
using backend.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/user-cocktails")]
public class UserCocktailController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<User> _userManager;

    public UserCocktailController(AppDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetUserCocktails([FromQuery] string? username = null)
    {
        User? user;

        // Se non viene passato uno username, usa l'utente autenticato
        if (string.IsNullOrEmpty(username))
        {
            user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized(new { message = "User not found or not authenticated." });
        }
        else
        {
            user = await _userManager.Users
                .Include(u => u.CreatedCocktails)
                .FirstOrDefaultAsync(u => u.UserName == username);

            if (user == null)
                return NotFound(new { message = $"User '{username}' not found." });
        }

        // Carica i cocktail creati
        var cocktails = await _context.Cocktails
            .Where(c => c.UserId == user.Id)
            .ToListAsync();

        return Ok(cocktails);
    }
}
