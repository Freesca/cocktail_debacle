using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services;
using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using Microsoft.EntityFrameworkCore;
using backend.Entities;
using Microsoft.AspNetCore.Identity;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly RecommendationService _recommendationService;
    private readonly AppDbContext _context;
    private readonly UserManager<User> _userManager;

    public RecommendationsController(RecommendationService recommendationService, AppDbContext context, UserManager<User> userManager)
    {
        _recommendationService = recommendationService;
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetRecommendations()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();
        
        var userId = user.Id;
        
        var cocktails = await _recommendationService.GetRecommendedCocktailsForUserAsync(userId);
        if (cocktails == null)
            cocktails = await _context.Cocktails
            .Select(c => new CocktailDto
            {
                IdDrink = c.IdDrink!,
                StrDrink = c.StrDrink!,
                StrDrinkThumb = c.StrDrinkThumb!,
                Popularity = c.FavoritedBy.Count(),
                ReviewsCount = c.Reviews.Count()
            })
            .OrderByDescending(c => c.Popularity)
            .ToListAsync();

        return Ok(cocktails);
    }
}
