'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    findOne: async function(ctx) {

        // Setup models
        const postModel = strapi.query('posts').model;
        const sectionsModel = strapi.query('sections').model;
        const adsModel = strapi.query('advertisements').model;
        
        
        // Get post id from parameters
        const {page = 'article'} = ctx.query;
        const {title} = ctx.params;

        // Get page ads
        const ads = await adsModel.findOne({page}).populate("clients_advertisements");

        
        // Get post data from mongodb
        const post = await postModel.findOne({$or: [{title}, {url: title}]}).populate({path: "section", select: 'name rank'});

        // If there's no post with this id, return 404 error
        if(!post) return null;

        // Increase post's views
        post.views = (post.views) + 1;
        await post.save();  

        
        // Get related posts with tags as an indicator
   	 const alsoRead = await postModel.find({tags: {$in: (post.tags || [])}, _id: {$ne: post._id}}).limit(4).sort({_id: -1})
	



        // Get most read posts from the alst 24 hours
        const mostReadToday = await postModel.find({createdAt: {
            $lt: new Date(), 
            $gte: new Date(new Date().setDate(new Date().getDate()-1))
        }}).sort('-views').limit(5);

        const sectionsNames = await sectionsModel.find({}, {name: 1,rank:1}).sort({rank: 1});

        
        // Send the response to teh user
        return {
            ads,
            post,
            alsoRead,
            mostReadToday,
            sectionsNames
        }
    },
    search: async function(ctx) {
        // Get serach text
        const {query} = ctx.params;

        // Get Post Model
        const postModel = strapi.query('posts').model;
        const sectionsModel = strapi.query('sections').model;
        const adsModel = strapi.query('advertisements').model;

        const {page = 'search', limit = 1} = ctx.query;

        const ads = await adsModel.findOne({page}).populate("clients_advertisements");

        const sectionsNames = await sectionsModel.find({}, {name: 1,rank: 1}).sort({rank: 1});

        // Search and response with search result
        const searchResult = await postModel.find({$or: [{title:{'$regex' : query, '$options' : 'i'}}, {body:{'$regex' : query, '$options' : 'i'}},{tags: query}]}).sort({createdAt: -1}).limit(Number(limit)).populate('section')

        return {
            ads,
            searchResult,
            sectionsNames,
        }
    }
};
